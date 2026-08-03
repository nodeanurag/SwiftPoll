"use server";

import { getServerClient } from "@/lib/supabase/server";

export interface PollComment {
  id: string;
  poll_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  content: string;
  created_at: string;
}

export interface CommentResult<T> {
  ok: boolean;
  error?: string;
  data?: T;
}

/** Retrieves all comments posted for a specific poll */
export async function getPollComments(pollId: string): Promise<CommentResult<PollComment[]>> {
  if (!pollId) return { ok: false, error: "Invalid poll ID." };

  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("poll_comments")
    .select("*")
    .eq("poll_id", pollId)
    .order("created_at", { ascending: true });

  if (error) {
    return { ok: false, error: "Could not retrieve comments." };
  }

  return { ok: true, data: data as PollComment[] };
}

/** Inserts a new collaborative comment from an authenticated member */
export async function postPollComment(
  pollId: string,
  content: string,
  token: string,
): Promise<CommentResult<PollComment>> {
  if (!pollId || !content || !content.trim() || !token) {
    return { ok: false, error: "Content and authentication token are required." };
  }

  const supabase = getServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return { ok: false, error: "Not authenticated." };
  }

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Anonymous Member";
  const userEmail = user.email || "";

  const { data, error } = await supabase
    .from("poll_comments")
    .insert({
      poll_id: pollId,
      user_id: user.id,
      user_name: userName,
      user_email: userEmail,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    return { ok: false, error: "Could not save comment." };
  }

  return { ok: true, data: data as PollComment };
}

/** Deletes a comment if the requester is the original author */
export async function deletePollComment(
  commentId: string,
  token: string,
): Promise<CommentResult<null>> {
  if (!commentId || !token) {
    return { ok: false, error: "Comment ID and authentication are required." };
  }

  const supabase = getServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return { ok: false, error: "Not authenticated." };
  }

  const { error } = await supabase
    .from("poll_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: "Could not delete comment." };
  }

  return { ok: true };
}
