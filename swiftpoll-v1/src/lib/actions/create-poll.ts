"use server";

import { getServerClient } from "@/lib/supabase/server";
import crypto from "crypto";
import { createPollSchema, type CreatePollInput } from "@/lib/validations/poll";
import { generateAdminToken, generateSlug } from "@/lib/utils/slug";
import { headers } from "next/headers";
import { hashIp } from "@/lib/utils/rate-limit";

export interface CreatePollResult {
  ok: boolean;
  slug?: string;
  adminToken?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

const MAX_SLUG_RETRIES = 5;

/**
 * Validate input, generate a unique slug + admin token, then insert the poll,
 * its options, and its secret in order. On any failure after the poll row is
 * created we roll back by deleting the poll (cascades to options).
 */
export async function createPoll(
  input: CreatePollInput,
  token?: string,
): Promise<CreatePollResult> {
  const parsed = createPollSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
    };
  }

  const { question, options, type, hideResults, requireAuth, workspaceId, webhookUrl, closesAt } = parsed.data;
  const supabase = getServerClient();

  // Determine user ID if token is provided
  let userId: string | null = null;
  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      userId = user.id;
    }
  }

  // Determine IP and hash it
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const creatorIpHash = hashIp(ip);

  // Check rate limit in database
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  if (userId) {
    const { count, error: countError } = await supabase
      .from("polls")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", oneDayAgo);

    if (countError) {
      return { ok: false, error: "Could not verify poll limit. Try again." };
    }

    if (count !== null && count >= 15) {
      return { ok: false, error: "You have reached the limit of 15 polls per day for signed-in users." };
    }
  } else {
    if (creatorIpHash) {
      const { count, error: countError } = await supabase
        .from("polls")
        .select("id", { count: "exact", head: true })
        .eq("creator_ip_hash", creatorIpHash)
        .gte("created_at", oneDayAgo);

      if (countError) {
        return { ok: false, error: "Could not verify poll limit. Try again." };
      }

      if (count !== null && count >= 3) {
        return { ok: false, error: "Anonymous limit reached (3 polls/day). Please sign in with Google to get 15 polls/day!" };
      }
    }
  }

  // Insert the poll with a fresh slug, retrying on the unlikely slug collision.
  let pollId: string | null = null;
  let slug = "";
  for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
    slug = generateSlug();
    const { data, error } = await supabase
      .from("polls")
      .insert({
        slug,
        question,
        type,
        hide_results: hideResults,
        closes_at: closesAt ?? null,
        closed: false,
        user_id: userId,
        creator_ip_hash: creatorIpHash,
        require_auth: requireAuth,
        workspace_id: workspaceId ?? null,
        webhook_url: webhookUrl || null,
        hide_results_until_close: input.hideResultsUntilClose ?? false,
        vote_limit: input.voteLimit ?? null,
        password_hash: input.password ? crypto.createHash("sha256").update(input.password).digest("hex") : null,
      })
      .select("id")
      .single();

    if (!error && data) {
      pollId = data.id;
      break;
    }
    // 23505 = unique_violation (slug clash) — retry with a new slug.
    if (error && error.code !== "23505") {
      return { ok: false, error: "Could not create the poll. Try again." };
    }
  }

  if (!pollId) {
    return { ok: false, error: "Could not generate a unique link. Try again." };
  }

  // If rating, scale or text, populate standard options
  let finalOptions = options;
  if (type === "rating") {
    finalOptions = ["1", "2", "3", "4", "5"];
  } else if (type === "scale") {
    finalOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  } else if (type === "text") {
    finalOptions = ["Response"];
  }

  // Insert options preserving their order.
  const optionRows = finalOptions.map((text, position) => ({
    poll_id: pollId as string,
    text,
    position,
    image_url: (type !== "rating" && type !== "scale" && type !== "reactions" && input.optionImages?.[position]) || null,
  }));
  const { error: optionsError } = await supabase
    .from("poll_options")
    .insert(optionRows);

  if (optionsError) {
    await supabase.from("polls").delete().eq("id", pollId);
    return { ok: false, error: "Could not save options. Try again." };
  }

  // Store the secret admin token (separate table, server-only access).
  const adminToken = generateAdminToken();
  const { error: secretError } = await supabase
    .from("poll_secrets")
    .insert({ poll_id: pollId, admin_token: adminToken });

  if (secretError) {
    await supabase.from("polls").delete().eq("id", pollId);
    return { ok: false, error: "Could not finalize the poll. Try again." };
  }

  // Trigger audit log if workspace exists
  if (workspaceId && userId) {
    try {
      const { data: userData } = await supabase.auth.getUser(token);
      const userEmail = userData?.user?.email || "";
      const { logWorkspaceAction } = await import("@/lib/actions/audit-log");
      await logWorkspaceAction(
        workspaceId,
        userId,
        userEmail,
        "poll.create",
        question
      );
    } catch (e) {
      console.error("Failed to insert audit log:", e);
    }
  }

  return { ok: true, slug, adminToken };
}
