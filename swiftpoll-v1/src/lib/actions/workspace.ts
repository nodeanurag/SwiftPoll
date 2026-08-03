"use server";

import { getServerClient } from "@/lib/supabase/server";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  created_by: string | null;
  created_at: string;
}

export interface WorkspaceMember {
  workspace_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  created_at: string;
}

export interface WorkspaceResult<T> {
  ok: boolean;
  error?: string;
  data?: T;
}

function generateWorkspaceSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") +
    "-" +
    Math.random().toString(36).substring(2, 6)
  );
}

/** Creates a new collaborative Workspace and registers the creator as its owner. */
export async function createWorkspace(
  name: string,
  token: string,
): Promise<WorkspaceResult<Workspace>> {
  if (!name || !token) return { ok: false, error: "Name is required." };

  const supabase = getServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return { ok: false, error: "Not authenticated." };

  const slug = generateWorkspaceSlug(name);

  // Insert workspace
  const { data: ws, error: wsError } = await supabase
    .from("workspaces")
    .insert({
      name,
      slug,
      created_by: user.id,
    })
    .select()
    .single();

  if (wsError || !ws) {
    return { ok: false, error: "Could not create workspace. Try again." };
  }

  // Insert owner member row
  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({
      workspace_id: ws.id,
      user_id: user.id,
      role: "owner",
    });

  if (memberError) {
    // Rollback workspace
    await supabase.from("workspaces").delete().eq("id", ws.id);
    return { ok: false, error: "Could not register membership. Try again." };
  }

  return { ok: true, data: ws };
}

/** Fetches all workspaces the authenticated user belongs to. */
export async function getWorkspaces(
  token: string,
): Promise<WorkspaceResult<Workspace[]>> {
  if (!token) return { ok: false, error: "Not authenticated." };

  const supabase = getServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return { ok: false, error: "Not authenticated." };

  // Fetch workspaces matching memberships
  const { data: memberships, error: memError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id);

  if (memError || !memberships) {
    return { ok: true, data: [] };
  }

  const ids = memberships.map((m) => m.workspace_id);
  if (ids.length === 0) return { ok: true, data: [] };

  const { data: ws, error: wsError } = await supabase
    .from("workspaces")
    .select()
    .in("id", ids)
    .order("name", { ascending: true });

  if (wsError) return { ok: false, error: "Could not load workspaces." };

  return { ok: true, data: ws || [] };
}

/** Invite another user to a workspace by looking up their Supabase user account by email. */
export async function inviteToWorkspace(
  workspaceId: string,
  email: string,
  token: string,
): Promise<WorkspaceResult<null>> {
  if (!workspaceId || !email || !token) return { ok: false, error: "Invalid request data." };

  const supabase = getServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return { ok: false, error: "Not authenticated." };

  // Verify that requester is owner or admin in this workspace
  const { data: member, error: memError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memError || !member || (member.role !== "owner" && member.role !== "admin")) {
    return { ok: false, error: "Only owners or admins can invite members." };
  }

  // Find target user by email in auth schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: targetUser, error: targetError } = await ((supabase as any)
    .schema("auth")
    .from("users")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle());

  if (targetError || !targetUser) {
    return { ok: false, error: "No registered user found with that email address." };
  }

  // Check if they are already a member
  const { data: exists } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", targetUser.id)
    .maybeSingle();

  if (exists) {
    return { ok: false, error: "User is already a member of this workspace." };
  }

  // Insert membership row
  const { error: inviteError } = await supabase
    .from("workspace_members")
    .insert({
      workspace_id: workspaceId,
      user_id: targetUser.id,
      role: "member",
    });

  if (inviteError) {
    return { ok: false, error: "Could not add member. Try again." };
  }

  // Trigger audit log for member invitation
  try {
    const { logWorkspaceAction } = await import("@/lib/actions/audit-log");
    await logWorkspaceAction(
      workspaceId,
      user.id,
      user.email || "",
      "member.invite",
      email
    );
  } catch (e) {
    console.error("Failed to insert member invite audit log:", e);
  }

  return { ok: true };
}
