import "server-only";

import { getServerClient } from "@/lib/supabase/server";
import { computePercentage } from "@/lib/utils/percentage";
import type { PollWithResults, PollType } from "@/types/poll";

interface PollRow {
  id: string;
  slug: string;
  question: string;
  type: PollType;
  hide_results: boolean;
  closed: boolean;
  closes_at: string | null;
  created_at: string;
  user_id: string | null;
  creator_ip_hash: string | null;
  require_auth: boolean;
  workspace_id: string | null;
  webhook_url: string | null;
  hide_results_until_close: boolean;
  vote_limit: number | null;
  password_hash: string | null;
}

/** Has this poll reached or passed its scheduled close time? */
function isExpired(closesAt: string | null): boolean {
  if (!closesAt) return false;
  return new Date(closesAt).getTime() <= Date.now();
}

/**
 * Fetch a poll by slug along with its options and aggregated vote counts.
 * Returns null when the slug does not exist. Used for the initial SSR of
 * `/p/[slug]`.
 */
export async function getPollWithResults(
  slug: string,
): Promise<PollWithResults | null> {
  const supabase = getServerClient();

  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select(
      "id, slug, question, type, hide_results, closed, closes_at, created_at, user_id, creator_ip_hash, require_auth, workspace_id, webhook_url, hide_results_until_close, vote_limit, password_hash",
    )
    .eq("slug", slug)
    .maybeSingle<PollRow>();

  if (pollError) throw pollError;
  if (!poll) return null;

  const [optionsRes, votesRes] = await Promise.all([
    supabase
      .from("poll_options")
      .select("id, text, position, image_url")
      .eq("poll_id", poll.id)
      .order("position", { ascending: true }),
    supabase.from("votes").select("option_id, rank, text_response").eq("poll_id", poll.id),
  ]);

  if (optionsRes.error) throw optionsRes.error;
  if (votesRes.error) throw votesRes.error;

  const counts = new Map<string, number>();
  const responses: string[] = [];
  const totalOptions = optionsRes.data?.length ?? 0;

  for (const row of votesRes.data ?? []) {
    if (poll.type === "ranking") {
      const r = row.rank ?? 0;
      const points = Math.max(totalOptions - r, 0);
      counts.set(row.option_id, (counts.get(row.option_id) ?? 0) + points);
    } else {
      counts.set(row.option_id, (counts.get(row.option_id) ?? 0) + 1);
    }

    if (poll.type === "text" && row.text_response) {
      responses.push(row.text_response);
    }
  }

  const totalVotes = votesRes.data?.length ?? 0;

  const options = (optionsRes.data ?? []).map((opt) => {
    const votes = counts.get(opt.id) ?? 0;
    return {
      id: opt.id,
      text: opt.text,
      position: opt.position,
      votes,
      percentage: computePercentage(votes, totalVotes),
      image_url: opt.image_url,
    };
  });

  return {
    ...poll,
    is_closed: poll.closed || isExpired(poll.closes_at),
    options,
    total_votes: totalVotes,
    hide_results_until_close: poll.hide_results_until_close,
    vote_limit: poll.vote_limit,
    require_password: !!poll.password_hash,
    responses: poll.type === "text" ? responses : undefined,
  };
}

export async function incrementPollViews(pollId: string): Promise<void> {
  const supabase = getServerClient();
  await supabase.rpc("increment_poll_views", { poll_id: pollId });
}
