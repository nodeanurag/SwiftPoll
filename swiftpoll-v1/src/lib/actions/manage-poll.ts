"use server";

import { revalidatePath } from "next/cache";
import { getServerClient } from "@/lib/supabase/server";
import { managePollSchema, type ManagePollInput } from "@/lib/validations/poll";

export interface ManageResult {
  ok: boolean;
  error?: string;
  /** For the `delete` action — tells the client to redirect home. */
  deleted?: boolean;
}

/**
 * Close, reopen, or delete a poll. Authorized purely by the secret admin token
 * (no accounts). The token is validated against poll_secrets via the
 * service-role client, so it is never exposed to the browser.
 */
export async function managePoll(
  input: ManagePollInput,
  token?: string,
): Promise<ManageResult> {
  const parsed = managePollSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const { slug, adminToken, action } = parsed.data;
  const supabase = getServerClient();

  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("id, user_id, workspace_id, question")
    .eq("slug", slug)
    .maybeSingle<{ id: string; user_id: string | null; workspace_id: string | null; question: string }>();

  if (pollError) return { ok: false, error: "Something went wrong." };
  if (!poll) return { ok: false, error: "Poll not found." };

  let isAuthorized = false;
  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token);
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
    if (!adminToken) return { ok: false, error: "Not authorized to manage this poll." };
    // Verify the admin token matches this poll.
    const { data: secret, error: secretError } = await supabase
      .from("poll_secrets")
      .select("poll_id")
      .eq("poll_id", poll.id)
      .eq("admin_token", adminToken)
      .maybeSingle<{ poll_id: string }>();

    if (secretError) return { ok: false, error: "Something went wrong." };
    if (!secret) return { ok: false, error: "Not authorized to manage this poll." };
  }

  if (action === "delete") {
    // Log before deleting (otherwise references cascade delete)
    if (poll.workspace_id) {
      try {
        let logUserId: string | null = null;
        let logUserEmail = "Admin (Token)";
        if (token) {
          const { data: { user } } = await supabase.auth.getUser(token);
          if (user) {
            logUserId = user.id;
            logUserEmail = user.email || "";
          }
        }
        const { logWorkspaceAction } = await import("@/lib/actions/audit-log");
        await logWorkspaceAction(
          poll.workspace_id,
          logUserId,
          logUserEmail,
          "poll.delete",
          poll.question
        );
      } catch (e) {
        console.error("Audit log deletion failed:", e);
      }
    }

    const { error } = await supabase.from("polls").delete().eq("id", poll.id);
    if (error) return { ok: false, error: "Could not delete the poll." };
    return { ok: true, deleted: true };
  }

  const { error } = await supabase
    .from("polls")
    .update({ closed: action === "close" })
    .eq("id", poll.id);

  if (error) return { ok: false, error: "Could not update the poll." };

  if (poll.workspace_id) {
    try {
      let logUserId: string | null = null;
      let logUserEmail = "Admin (Token)";
      if (token) {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          logUserId = user.id;
          logUserEmail = user.email || "";
        }
      }
      const { logWorkspaceAction } = await import("@/lib/actions/audit-log");
      await logWorkspaceAction(
        poll.workspace_id,
        logUserId,
        logUserEmail,
        action === "close" ? "poll.close" : "poll.reopen",
        poll.question
      );
    } catch (e) {
      console.error("Audit log action update failed:", e);
    }
  }

  revalidatePath(`/p/${slug}`);
  return { ok: true };
}

export interface EditQuestionInput {
  slug: string;
  newQuestion: string;
  adminToken?: string;
}

export async function editPollQuestion(
  input: EditQuestionInput,
  token?: string,
): Promise<ManageResult> {
  const question = input.newQuestion.trim();
  if (!question || question.length > 200) {
    return { ok: false, error: "Question must be between 1 and 200 characters." };
  }

  const supabase = getServerClient();

  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("id, user_id, created_at")
    .eq("slug", input.slug)
    .maybeSingle<{ id: string; user_id: string | null; created_at: string }>();

  if (pollError) return { ok: false, error: "Something went wrong." };
  if (!poll) return { ok: false, error: "Poll not found." };

  const createdAtMs = new Date(poll.created_at).getTime();
  const nowMs = Date.now();
  const elapsedSeconds = (nowMs - createdAtMs) / 1000;
  if (elapsedSeconds > 100) {
    return { ok: false, error: "The 100-second window to edit this question has expired." };
  }

  let isAuthorized = false;
  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user && poll.user_id === user.id) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    if (!input.adminToken) return { ok: false, error: "Not authorized to edit this poll." };
    const { data: secret, error: secretError } = await supabase
      .from("poll_secrets")
      .select("poll_id")
      .eq("poll_id", poll.id)
      .eq("admin_token", input.adminToken)
      .maybeSingle<{ poll_id: string }>();

    if (secretError) return { ok: false, error: "Something went wrong." };
    if (!secret) return { ok: false, error: "Not authorized to edit this poll." };
  }

  const { error: updateError } = await supabase
    .from("polls")
    .update({ question })
    .eq("id", poll.id);

  if (updateError) return { ok: false, error: "Could not update the question." };

  revalidatePath(`/p/${input.slug}`);
  return { ok: true };
}
