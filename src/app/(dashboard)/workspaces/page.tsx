"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "@/context/dashboard-context";
import { 
  Folder, 
  Users, 
  Plus, 
  UserPlus, 
  Loader, 
  Check, 
  History,
  Info
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createWorkspace, inviteToWorkspace } from "@/lib/actions/workspace";
import { cn } from "@/lib/utils/cn";

interface AuditLogItem {
  id: string;
  user_email: string;
  action: string;
  target_name: string;
  created_at: string;
}

export default function WorkspaceSettingsPage() {
  const { 
    sessionToken, 
    workspaces, 
    setWorkspaces,
    activeWorkspace, 
    setActiveWorkspace 
  } = useDashboard();

  const [activeTab, setActiveTab] = useState<"members" | "audit" | "all">("members");
  
  // Forms states
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [wsMessage, setWsMessage] = useState<string | null>(null);
  const [wsError, setWsError] = useState<string | null>(null);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  // Audit Logs states
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  // Fetch workspace audit logs when active workspace or tab changes
  useEffect(() => {
    const wsId = activeWorkspace?.id;
    if (!wsId || activeTab !== "audit" || !sessionToken) return;

    const currentWsId = wsId;
    const currentToken = sessionToken;

    async function fetchLogs() {
      setLoadingAuditLogs(true);
      try {
        const { getWorkspaceAuditLogs } = await import("@/lib/actions/audit-log");
        const res = await getWorkspaceAuditLogs(currentWsId, currentToken);
        if (res.ok && res.data) {
          setAuditLogs(res.data);
        }
      } catch (err) {
        console.error("Could not load audit logs:", err);
      } finally {
        setLoadingAuditLogs(false);
      }
    }

    void fetchLogs();
  }, [activeWorkspace, activeTab, sessionToken]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim() || !sessionToken) return;
    setIsCreatingWorkspace(true);
    setWsError(null);
    setWsMessage(null);

    const res = await createWorkspace(newWorkspaceName, sessionToken);
    setIsCreatingWorkspace(false);
    if (res.ok && res.data) {
      setWorkspaces((prev) => [...prev, res.data!]);
      setActiveWorkspace(res.data);
      setNewWorkspaceName("");
      setWsMessage("Workspace created successfully!");
      setActiveTab("members");
    } else {
      setWsError(res.error ?? "Failed to create workspace.");
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeWorkspace || !sessionToken) return;
    setIsInviting(true);
    setWsError(null);
    setWsMessage(null);

    const res = await inviteToWorkspace(activeWorkspace.id, inviteEmail, sessionToken);
    setIsInviting(false);
    if (res.ok) {
      setInviteEmail("");
      setWsMessage(`Successfully invited ${inviteEmail}!`);
    } else {
      setWsError(res.error ?? "Failed to invite member.");
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-5xl mx-auto w-full">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-3xl font-normal text-fg">Workspace</h1>
        <p className="text-xs text-muted-fg mt-1">Configure your workspaces, invite collaborators, and view activity history.</p>
      </div>

      {wsMessage && (
        <div className="p-4 rounded-xl border border-green-200 bg-green-50 text-green-800 dark:border-green-950/30 dark:bg-green-950/20 dark:text-green-300 text-sm shadow-sm">
          {wsMessage}
        </div>
      )}
      {wsError && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 dark:border-red-950/30 dark:bg-red-950/20 dark:text-red-300 text-sm shadow-sm">
          {wsError}
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex justify-between items-center gap-4 border-b border-border/50 pb-2">
        <div className="flex gap-4">
          <button
            onClick={() => { setActiveTab("members"); setWsMessage(null); setWsError(null); }}
            className={cn(
              "text-xs font-semibold pb-2 border-b-2 transition-all cursor-pointer",
              activeTab === "members" ? "border-brand-500 text-fg" : "border-transparent text-muted-fg hover:text-fg"
            )}
          >
            Team Members
          </button>
          <button
            onClick={() => { setActiveTab("audit"); setWsMessage(null); setWsError(null); }}
            className={cn(
              "text-xs font-semibold pb-2 border-b-2 transition-all cursor-pointer",
              activeTab === "audit" ? "border-brand-500 text-fg" : "border-transparent text-muted-fg hover:text-fg"
            )}
          >
            Audit Logs
          </button>
          <button
            onClick={() => { setActiveTab("all"); setWsMessage(null); setWsError(null); }}
            className={cn(
              "text-xs font-semibold pb-2 border-b-2 transition-all cursor-pointer",
              activeTab === "all" ? "border-brand-500 text-fg" : "border-transparent text-muted-fg hover:text-fg"
            )}
          >
            All Workspaces
          </button>
        </div>
      </div>

      {/* Active Tab rendering */}
      {activeTab === "members" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Members List */}
          <Card className="lg:col-span-2 p-6 border border-border bg-card rounded-2xl shadow-sm space-y-4">
            <h3 className="font-serif text-lg font-normal text-fg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              <span>Workspace Members</span>
            </h3>

            {!activeWorkspace ? (
              <div className="p-6 text-center text-xs text-muted-fg bg-subtle/20 border border-dashed rounded-xl flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0 text-muted-fg" />
                <span>You are currently in your Personal Space. Create or select a team workspace to invite team members.</span>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-fg">Teammates with access to the <strong>{activeWorkspace.name}</strong> workspace:</p>
                <div className="divide-y divide-border/50">
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-xs font-medium text-fg">You (Workspace Owner)</span>
                    <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold text-blue-400 border border-blue-500/20">
                      Owner
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Invite form */}
          {activeWorkspace && (
            <Card className="p-6 border border-border bg-card rounded-2xl shadow-sm space-y-4">
              <h3 className="font-serif text-base font-semibold text-fg flex items-center gap-2">
                <UserPlus className="h-4.5 w-4.5 text-brand-500" />
                <span>Invite teammate</span>
              </h3>
              <p className="text-xs text-muted-fg leading-relaxed">
                Add teammates to collaborate and manage polls in this workspace.
              </p>
              <form onSubmit={handleInviteMember} className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="invite-email" className="text-xs font-semibold text-fg">Email Address</label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="teammate@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="text-xs h-10 w-full"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isInviting || !inviteEmail.trim()}
                  className="w-full h-10 cursor-pointer"
                >
                  {isInviting ? <Loader className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  Send invitation
                </Button>
              </form>
            </Card>
          )}
        </div>
      )}

      {activeTab === "audit" && (
        <Card className="p-6 border border-border bg-card rounded-2xl shadow-sm space-y-4">
          <h3 className="font-serif text-lg font-normal text-fg flex items-center gap-2">
            <History className="h-5 w-5 text-orange-400" />
            <span>Workspace Activity Logs</span>
          </h3>

          {!activeWorkspace ? (
            <div className="p-6 text-center text-xs text-muted-fg bg-subtle/20 border border-dashed rounded-xl flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0" />
              Select a team workspace to view audit logs.
            </div>
          ) : loadingAuditLogs ? (
            <div className="py-12 flex justify-center"><Loader className="h-6 w-6 animate-spin text-brand-500" /></div>
          ) : auditLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-fg border border-dashed rounded-xl bg-subtle/20">
              No workspace events recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {auditLogs.map((log) => {
                let actionText = "";
                if (log.action === "poll.create") actionText = "created poll";
                else if (log.action === "poll.delete") actionText = "deleted poll";
                else if (log.action === "poll.close") actionText = "closed poll";
                else if (log.action === "poll.reopen") actionText = "reopened poll";
                else if (log.action === "member.invite") actionText = "invited user";

                return (
                  <div key={log.id} className="py-3.5 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-fg leading-snug">
                        <strong className="font-semibold text-blue-400 font-mono">{log.user_email}</strong>
                        <span className="text-muted-fg"> {actionText} </span>
                        <strong className="font-semibold">&ldquo;{log.target_name}&rdquo;</strong>.
                      </p>
                      <p className="text-[10px] text-muted-fg">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {activeTab === "all" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* List of workspaces */}
          <Card className="lg:col-span-2 p-6 border border-border bg-card rounded-2xl shadow-sm space-y-4">
            <h3 className="font-serif text-lg font-normal text-fg flex items-center gap-2">
              <Folder className="h-5 w-5 text-brand-500" />
              <span>Available Workspaces</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Personal Space option */}
              <button
                type="button"
                onClick={() => setActiveWorkspace(null)}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border text-left cursor-pointer transition-all",
                  !activeWorkspace
                    ? "border-brand-500 bg-brand-500/10 text-brand-500"
                    : "border-border bg-subtle/30 text-fg hover:border-brand-500/30"
                )}
              >
                <div>
                  <p className="font-semibold text-xs">👤 Personal Space</p>
                  <p className="text-[10px] text-muted-fg mt-0.5">Your private sandbox space</p>
                </div>
                {!activeWorkspace && <Check className="h-4 w-4" />}
              </button>

              {/* Team Spaces options */}
              {workspaces.map((ws) => {
                const isActive = activeWorkspace?.id === ws.id;
                return (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => setActiveWorkspace(ws)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border text-left cursor-pointer transition-all",
                      isActive
                        ? "border-brand-500 bg-brand-500/10 text-brand-500"
                        : "border-border bg-subtle/30 text-fg hover:border-brand-500/30"
                    )}
                  >
                    <div>
                      <p className="font-semibold text-xs">🏢 {ws.name}</p>
                      <p className="text-[10px] text-muted-fg mt-0.5">Collaborative workspace</p>
                    </div>
                    {isActive && <Check className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Create Workspace Card */}
          <Card className="p-6 border border-border bg-card rounded-2xl shadow-sm space-y-4">
            <h3 className="font-serif text-base font-semibold text-fg flex items-center gap-2">
              <Plus className="h-4.5 w-4.5 text-brand-500" />
              <span>Create Space</span>
            </h3>
            <p className="text-xs text-muted-fg leading-relaxed">
              Start a new team workspace to collaborate, aggregate answers, and share analytical charts.
            </p>
            <form onSubmit={handleCreateWorkspace} className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="ws-name" className="text-xs font-semibold text-fg">Workspace Name</label>
                <Input
                  id="ws-name"
                  placeholder="e.g. Acme Marketing"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="text-xs h-10 w-full"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isCreatingWorkspace || !newWorkspaceName.trim()}
                className="w-full h-10 cursor-pointer"
              >
                {isCreatingWorkspace ? <Loader className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Create Space
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
