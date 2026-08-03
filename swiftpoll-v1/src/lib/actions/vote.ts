"use server";

import { headers } from "next/headers";
import crypto from "crypto";
import { getServerClient } from "@/lib/supabase/server";
import { voteSchema, type VoteInput } from "@/lib/validations/poll";
import { checkRateLimit, hashIp } from "@/lib/utils/rate-limit";

export interface VoteResult {
  ok: boolean;
  /** Ids of the vote rows just created — used client-side to de-dupe the
   *  voter's own Realtime INSERT events. */
  voteIds?: string[];
  error?: string;
}

/** Best-effort client IP from common proxy headers. */
async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return h.get("x-real-ip");
}

export async function vote(input: VoteInput, token?: string): Promise<VoteResult> {
  const parsed = voteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid vote." };
  }
  const { slug, optionIds, voterId } = parsed.data;
  const uniqueOptionIds = Array.from(new Set(optionIds));

  const supabase = getServerClient();

  // Load the poll and confirm it is open.
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("id, type, closed, closes_at, require_auth, webhook_url, question, password_hash, vote_limit")
    .eq("slug", slug)
    .maybeSingle<{
      id: string;
      type: "single" | "multiple" | "rating" | "scale" | "reactions" | "ranking" | "text";
      closed: boolean;
      closes_at: string | null;
      require_auth: boolean;
      webhook_url: string | null;
      question: string;
      password_hash: string | null;
      vote_limit: number | null;
    }>();

  if (pollError) return { ok: false, error: "Something went wrong." };
  if (!poll) return { ok: false, error: "Poll not found." };

  const expired = poll.closes_at
    ? new Date(poll.closes_at).getTime() <= Date.now()
    : false;
  if (poll.closed || expired) {
    return { ok: false, error: "This poll is closed." };
  }

  // Determine user ID if token is provided
  let userId: string | null = null;
  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      userId = user.id;
    }
  }

  if (poll.require_auth) {
    if (!userId) {
      return { ok: false, error: "Only signed-in users can vote on this poll." };
    }

    // Check if they've already voted on this poll with this account
    const { count, error: countError } = await supabase
      .from("votes")
      .select("id", { count: "exact", head: true })
      .eq("poll_id", poll.id)
      .eq("user_id", userId);

    if (countError) {
      return { ok: false, error: "Could not verify voting history." };
    }

    if (count && count > 0) {
      return { ok: false, error: "You've already voted on this poll." };
    }
  }

  // Password verification
  if (poll.password_hash) {
    if (!input.password) {
      return { ok: false, error: "Password required for this poll." };
    }
    const inputHash = crypto.createHash("sha256").update(input.password).digest("hex");
    if (inputHash !== poll.password_hash) {
      return { ok: false, error: "Incorrect password." };
    }
  }

  // Vote limit verification
  if (poll.vote_limit) {
    const { count, error: countVotesError } = await supabase
      .from("votes")
      .select("id", { count: "exact", head: true })
      .eq("poll_id", poll.id);

    if (countVotesError) {
      return { ok: false, error: "Could not verify vote limit." };
    }
    if (count !== null && count >= poll.vote_limit) {
      return { ok: false, error: "This poll has reached its vote limit." };
    }
  }

  if ((poll.type === "single" || poll.type === "rating" || poll.type === "scale" || poll.type === "reactions" || poll.type === "text") && uniqueOptionIds.length !== 1) {
    return { ok: false, error: "Select exactly one option." };
  }

  // Confirm every option belongs to this poll (prevents cross-poll injection).
  const { data: validOptions, error: optError } = await supabase
    .from("poll_options")
    .select("id")
    .eq("poll_id", poll.id)
    .in("id", uniqueOptionIds);

  if (optError) return { ok: false, error: "Something went wrong." };
  if (!validOptions || validOptions.length !== uniqueOptionIds.length) {
    return { ok: false, error: "Invalid option." };
  }

  // Server-side rate limit by hashed IP (the real abuse guard).
  const ipHash = hashIp(await getClientIp());
  const { allowed } = await checkRateLimit(poll.id, ipHash);
  if (!allowed) {
    return { ok: false, error: "You've already voted on this poll." };
  }

  const rows = uniqueOptionIds.map((optionId) => ({
    poll_id: poll.id,
    option_id: optionId,
    voter_id: voterId ?? null,
    ip_hash: ipHash,
    user_id: userId,
    rank: input.ranks?.[optionId] ?? null,
    text_response: input.textResponse ?? null,
    vote_duration_ms: input.durationMs ?? null,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("votes")
    .insert(rows)
    .select("id");

  if (insertError) return { ok: false, error: "Could not record your vote." };

  // Write to the rate_limits table to persist the rate limit state
  if (ipHash) {
    const { error: limitError } = await supabase
      .from("rate_limits")
      .insert({
        ip_hash: ipHash,
        action: `vote:${poll.id}`,
      });
    if (limitError) {
      console.error("Could not record rate limit entry:", limitError);
    }
  }

  // Trigger Webhook asynchronously if configured
  if (poll.webhook_url) {
    const isDiscord = poll.webhook_url.includes("discord.com/api/webhooks");
    const isSlack = poll.webhook_url.includes("hooks.slack.com/services");
    const votedAt = new Date().toISOString();
    
    let webhookBody: Record<string, unknown> = {};
    if (isDiscord) {
      webhookBody = {
        embeds: [{
          title: "New Vote Cast! 🎉",
          description: "A voter has submitted their choice on SwiftPoll.",
          color: 5814783,
          fields: [
            { name: "Poll Question", value: poll.question, inline: false },
            { name: "Selected Options", value: `${uniqueOptionIds.length} choice(s)`, inline: true },
            { name: "Voted At", value: new Date(votedAt).toLocaleString(), inline: true }
          ],
          footer: { text: "Powered by SwiftPoll Webhooks" }
        }]
      };
    } else if (isSlack) {
      webhookBody = {
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*New Vote Cast on SwiftPoll!* 🎉\n\n*Question:* ${poll.question}\n*Selected Choices:* ${uniqueOptionIds.length} option(s)\n*Voted At:* ${new Date(votedAt).toLocaleString()}`
            }
          }
        ]
      };
    } else {
      webhookBody = {
        event: "poll.vote",
        poll_id: poll.id,
        poll_slug: slug,
        question: poll.question,
        option_ids: uniqueOptionIds,
        voted_at: votedAt
      };
    }

    void fetch(poll.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookBody)
    }).catch((err) => {
      console.error("Webhook POST failed:", err);
    });
  }

  return { ok: true, voteIds: (inserted ?? []).map((r) => r.id) };
}

export async function verifyPollPassword(slug: string, password?: string): Promise<{ ok: boolean }> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("polls")
    .select("password_hash")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data || !data.password_hash) return { ok: true };
  if (!password) return { ok: false };

  const hash = crypto.createHash("sha256").update(password).digest("hex");
  return { ok: hash === data.password_hash };
}
