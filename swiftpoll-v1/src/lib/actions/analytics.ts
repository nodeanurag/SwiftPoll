"use server";

import { getServerClient } from "@/lib/supabase/server";

export interface AnalyticsVote {
  id: string;
  option_id: string;
  created_at: string;
  voter_id: string | null;
  vote_duration_ms: number | null;
  rank?: number | null;
  text_response?: string | null;
}

export interface AnalyticsOption {
  id: string;
  text: string;
  position: number;
}

export interface PollAnalyticsResult {
  ok: boolean;
  error?: string;
  poll?: {
    id: string;
    slug: string;
    question: string;
    type: string;
    closed: boolean;
    closes_at: string | null;
    created_at: string;
    user_id: string | null;
    require_auth: boolean;
    workspace_id: string | null;
    views: number;
    webhook_url: string | null;
  };
  options?: AnalyticsOption[];
  votes?: AnalyticsVote[];
}

/**
 * Fetch detailed votes log, options list, and metadata for a poll.
 * Authorized purely by creator credentials (sessionToken or adminToken).
 */
export async function getPollAnalytics(
  slug: string,
  adminToken?: string,
  sessionToken?: string,
): Promise<PollAnalyticsResult> {
  if (!slug) return { ok: false, error: "Invalid request." };

  const supabase = getServerClient();

  // 1. Fetch poll details
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("id, slug, question, type, closed, closes_at, created_at, user_id, require_auth, workspace_id, views, webhook_url")
    .eq("slug", slug)
    .maybeSingle<{
      id: string;
      slug: string;
      type: string;
      question: string;
      closed: boolean;
      closes_at: string | null;
      created_at: string;
      user_id: string | null;
      require_auth: boolean;
      workspace_id: string | null;
      views: number;
      webhook_url: string | null;
    }>();

  if (pollError) return { ok: false, error: "Something went wrong." };
  if (!poll) return { ok: false, error: "Poll not found." };

  // 2. Verify authorization
  let isAuthorized = false;
  if (sessionToken) {
    const { data: { user } } = await supabase.auth.getUser(sessionToken);
    if (user) {
      if (poll.user_id === user.id) {
        isAuthorized = true;
      } else if (poll.workspace_id) {
        const { data: membership } = await supabase
          .from("workspace_members")
          .select("role")
          .eq("workspace_id", poll.workspace_id)
          .eq("user_id", user.id)
          .maybeSingle();
        if (membership) {
          isAuthorized = true;
        }
      }
    }
  }

  if (!isAuthorized) {
    if (!adminToken) {
      return { ok: false, error: "Not authorized to view analytics." };
    }
    // Verify local adminToken matches
    const { data: secret, error: secretError } = await supabase
      .from("poll_secrets")
      .select("poll_id")
      .eq("poll_id", poll.id)
      .eq("admin_token", adminToken)
      .maybeSingle<{ poll_id: string }>();

    if (secretError || !secret) {
      return { ok: false, error: "Not authorized to view analytics." };
    }
  }

  // 3. Fetch options and raw votes
  const [optionsRes, votesRes] = await Promise.all([
    supabase
      .from("poll_options")
      .select("id, text, position")
      .eq("poll_id", poll.id)
      .order("position", { ascending: true }),
    supabase
      .from("votes")
      .select("id, option_id, created_at, voter_id, vote_duration_ms")
      .eq("poll_id", poll.id)
      .order("created_at", { ascending: true }),
  ]);

  if (optionsRes.error) return { ok: false, error: "Could not fetch options." };
  if (votesRes.error) return { ok: false, error: "Could not fetch votes." };

  return {
    ok: true,
    poll,
    options: optionsRes.data as AnalyticsOption[],
    votes: votesRes.data as AnalyticsVote[],
  };
}
