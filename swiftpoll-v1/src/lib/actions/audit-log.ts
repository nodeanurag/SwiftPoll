"use server";

import { getServerClient } from "@/lib/supabase/server";

export interface AuditLogRecord {
  id: string;
  workspace_id: string;
  user_id: string | null;
  user_email: string;
  action: string;
  target_name: string;
  created_at: string;
}

export interface AuditLogResult<T> {
  ok: boolean;
  error?: string;
  data?: T;
}

/** Inserts a new audit log entry for the workspace action */
export async function logWorkspaceAction(
  workspaceId: string,
  userId: string | null,
  userEmail: string,
  action: "poll.create" | "poll.delete" | "poll.close" | "poll.reopen" | "member.invite",
  targetName: string,
): Promise<void> {
  if (!workspaceId) return;

  const supabase = getServerClient();
  await supabase.from("audit_logs").insert({
    workspace_id: workspaceId,
    user_id: userId,
    user_email: userEmail,
    action,
    target_name: targetName,
  });
}

/** Fetches workspace audit logs for active workspace members */
export async function getWorkspaceAuditLogs(
  workspaceId: string,
  token: string,
): Promise<AuditLogResult<AuditLogRecord[]>> {
  if (!workspaceId || !token) return { ok: false, error: "Invalid request parameters." };

  const supabase = getServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return { ok: false, error: "Not authenticated." };

  // Verify membership
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return { ok: false, error: "Not a member of this workspace." };
  }

  // Retrieve logs chronologically
  const { data: logs, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    return { ok: false, error: "Could not load audit logs." };
  }

  return { ok: true, data: logs as AuditLogRecord[] };
}
