"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDashboard } from "@/context/dashboard-context";
import { 
  BarChart3, 
  Vote, 
  ExternalLink, 
  PlusCircle, 
  LayoutTemplate, 
  Folder, 
  FolderOpen,
  Loader,
  Users,
  ArrowRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AuditLogItem {
  id: string;
  user_email: string;
  action: string;
  target_name: string;
  created_at: string;
}

export default function DashboardCommandCenter() {
  const { 
    user, 
    sessionToken, 
    workspaces, 
    activeWorkspace, 
    setActiveWorkspace,
    polls, 
    loadingPolls,
    currentTime
  } = useDashboard();

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  // Fetch workspace audit logs when active workspace changes
  useEffect(() => {
    if (!activeWorkspace?.id || !sessionToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAuditLogs([]);
      return;
    }

    const currentWsId = activeWorkspace.id;
    const currentToken = sessionToken;

    async function fetchLogs() {
      setLoadingAuditLogs(true);
      try {
        const { getWorkspaceAuditLogs } = await import("@/lib/actions/audit-log");
        const res = await getWorkspaceAuditLogs(currentWsId, currentToken);
        if (res.ok && res.data) {
          setAuditLogs(res.data.slice(0, 5)); // show only recent 5 logs
        }
      } catch (err) {
        console.error("Could not load audit logs:", err);
      } finally {
        setLoadingAuditLogs(false);
      }
    }

    void fetchLogs();
  }, [activeWorkspace, sessionToken]);

  // Aggregate stats
  const totalPolls = polls.length;
  const activePolls = polls.filter((p) => {
    const expired = p.closes_at ? new Date(p.closes_at).getTime() <= currentTime : false;
    return !p.closed && !expired;
  }).length;
  const totalVotes = polls.reduce((acc, p) => acc + (p.votes?.[0]?.count ?? 0), 0);

  // Recent 3 polls
  const recentPolls = polls.slice(0, 3);

  return (
    <div className="flex-1 min-w-0 flex flex-col max-w-[1600px] w-full mx-auto px-6 sm:px-8 py-6">
      {/* Reduced Hero Banner Section */}
      <section className="relative bg-gradient-to-r from-carbon-layer to-graphite-panel text-fg py-5 px-6 rounded-2xl mb-6 overflow-hidden border border-border/10 shadow-md">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-brand-500 opacity-[0.03] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-brand-500 opacity-[0.03] blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-brand-500 font-bold text-[9px] tracking-[0.15em] uppercase font-sans">
                Command Center
              </span>
              {user ? (
                <span className="inline-flex items-center rounded-full bg-brand-500/10 px-2 py-0.5 text-[8px] font-bold text-brand-500 border border-brand-500/20">
                  Pro
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[8px] font-bold text-amber-500 border border-amber-500/20">
                  Guest
                </span>
              )}
            </div>
            
            <h1 className="font-serif text-2xl font-normal leading-tight tracking-tight text-white">
              Welcome back, <span className="text-brand-500 font-serif">{user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Creator"}</span>
            </h1>
            
            <p className="text-[11px] text-muted-fg max-w-xl opacity-90 leading-relaxed">
              Overview of active collaborative workspaces, poll volumes, and programmatical keys.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            {user && (
              <div className="flex flex-col items-start gap-1 w-full sm:w-auto">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-fg/70">
                  Active Space
                </span>
                <select
                  value={activeWorkspace?.id || ""}
                  onChange={(e) => {
                    const id = e.target.value;
                    const ws = workspaces.find((w) => w.id === id) || null;
                    setActiveWorkspace(ws);
                  }}
                  className="h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer text-white min-w-[180px] shadow-sm hover:bg-white/10 transition-all w-full md:w-auto"
                >
                  <option value="" className="bg-card text-fg">Personal Space</option>
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id} className="bg-card text-fg">
                      🏢 {ws.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Link href="/polls/create" className="hidden sm:inline-block">
              <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-bg text-[11px] font-bold h-9 px-3 border-0 rounded-xl cursor-pointer mt-3.5">
                + Create Poll
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        {/* Stripe-like KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Polls */}
          <Card className="p-5 rounded-2xl flex flex-col justify-between h-28 border border-border bg-card shadow-sm hover:border-brand-500/20 duration-150 transition-all">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-fg/90">Total Polls</span>
              <div className="bg-blue-500/10 border border-blue-500/20 p-2 rounded-xl text-blue-600 dark:text-blue-400">
                <BarChart3 className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <p className="text-3xl font-bold font-serif text-fg">{loadingPolls ? "..." : totalPolls}</p>
              <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                +12%
              </span>
            </div>
          </Card>

          {/* Active Polls */}
          <Card className="p-5 rounded-2xl flex flex-col justify-between h-28 border border-border bg-card shadow-sm hover:border-brand-500/20 duration-150 transition-all">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-fg/90">Active Polls</span>
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl text-emerald-600 dark:text-emerald-400">
                <Vote className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <p className="text-3xl font-bold font-serif text-fg">{loadingPolls ? "..." : activePolls}</p>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                +5%
              </span>
            </div>
          </Card>

          {/* Total Votes */}
          <Card className="p-5 rounded-2xl flex flex-col justify-between h-28 border border-border bg-card shadow-sm hover:border-brand-500/20 duration-150 transition-all">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-fg/90">Total Votes</span>
              <div className="bg-orange-500/10 border border-orange-500/20 p-2 rounded-xl text-orange-600 dark:text-orange-400">
                <ExternalLink className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <p className="text-3xl font-bold font-serif text-fg">{loadingPolls ? "..." : totalVotes.toLocaleString()}</p>
              <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2 py-0.5 text-[9px] font-bold text-orange-600 dark:text-orange-400 border border-orange-500/20">
                +22%
              </span>
            </div>
          </Card>
        </div>

        {/* Vercel-like Quick Actions */}
        <div className="space-y-2.5">
          <h3 className="font-serif text-base font-normal tracking-tight text-fg">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/polls/create">
              <Card className="p-4.5 border border-border bg-card flex items-center justify-between gap-4 hover:border-brand-500 hover:bg-subtle/30 transition-all duration-200 cursor-pointer group h-20 rounded-2xl">
                <div className="flex items-center gap-3.5">
                  <div className="bg-brand-500/10 border border-brand-500/20 p-2.5 rounded-xl text-brand-500 group-hover:scale-110 duration-200 transition-transform">
                    <PlusCircle className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold block text-fg">Create Poll</span>
                    <span className="text-[10px] text-muted-fg block leading-normal mt-0.5">Start building a new poll</span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-fg group-hover:text-fg group-hover:translate-x-1 duration-150 transition-transform" />
              </Card>
            </Link>

            <Link href="/analytics">
              <Card className="p-4.5 border border-border bg-card flex items-center justify-between gap-4 hover:border-brand-500 hover:bg-subtle/30 transition-all duration-200 cursor-pointer group h-20 rounded-2xl">
                <div className="flex items-center gap-3.5">
                  <div className="bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl text-blue-400 group-hover:scale-110 duration-200 transition-transform">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold block text-fg">View Analytics</span>
                    <span className="text-[10px] text-muted-fg block leading-normal mt-0.5">Examine answer trends</span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-fg group-hover:text-fg group-hover:translate-x-1 duration-150 transition-transform" />
              </Card>
            </Link>

            <Link href="/templates">
              <Card className="p-4.5 border border-border bg-card flex items-center justify-between gap-4 hover:border-brand-500 hover:bg-subtle/30 transition-all duration-200 cursor-pointer group h-20 rounded-2xl">
                <div className="flex items-center gap-3.5">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-emerald-400 group-hover:scale-110 duration-200 transition-transform">
                    <LayoutTemplate className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold block text-fg">Templates</span>
                    <span className="text-[10px] text-muted-fg block leading-normal mt-0.5">Launch pre-built templates</span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-fg group-hover:text-fg group-hover:translate-x-1 duration-150 transition-transform" />
              </Card>
            </Link>

            <Link href="/workspaces">
              <Card className="p-4.5 border border-border bg-card flex items-center justify-between gap-4 hover:border-brand-500 hover:bg-subtle/30 transition-all duration-200 cursor-pointer group h-20 rounded-2xl">
                <div className="flex items-center gap-3.5">
                  <div className="bg-orange-500/10 border border-orange-500/20 p-2.5 rounded-xl text-orange-400 group-hover:scale-110 duration-200 transition-transform">
                    <Folder className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold block text-fg">Workspaces</span>
                    <span className="text-[10px] text-muted-fg block leading-normal mt-0.5">Manage team preferences</span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-fg group-hover:text-fg group-hover:translate-x-1 duration-150 transition-transform" />
              </Card>
            </Link>
          </div>
        </div>

        {/* Bottom Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Recent Polls */}
          <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-serif text-base font-normal tracking-tight text-fg flex items-center justify-between">
              <span>Recent Polls</span>
              <Link href="/polls" className="text-xs text-brand-500 hover:underline">View All</Link>
            </h3>

            {loadingPolls ? (
              <div className="py-12 flex justify-center"><Loader className="h-5 w-5 animate-spin text-brand-500" /></div>
            ) : recentPolls.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-fg flex flex-col items-center justify-center border border-dashed rounded-xl bg-subtle/10 border-border/50 max-w-md mx-auto p-4 space-y-2">
                <FolderOpen className="h-6 w-6 text-muted-fg mb-1" />
                <p className="font-semibold text-fg">No polls yet</p>
                <p className="text-[10px] text-muted-fg mt-0.5">Create your first poll to gather answers.</p>
                <Link href="/polls/create" className="inline-block mt-2">
                  <Button size="sm" className="text-[10px] h-7 bg-brand-500 hover:bg-brand-600 text-bg font-bold cursor-pointer">
                    Create Poll
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentPolls.map((poll) => (
                  <div key={poll.id} className="flex justify-between items-center p-3 rounded-xl border border-border bg-subtle/20 hover:border-brand-500/20 duration-150 transition-colors">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-serif text-sm font-normal text-fg truncate">{poll.question}</p>
                      <p className="text-[10px] text-muted-fg mt-0.5">
                        {new Date(poll.created_at).toLocaleDateString()} · {poll.votes?.[0]?.count ?? 0} votes
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/p/${poll.slug}`} target="_blank">
                        <Button variant="secondary" size="sm" className="text-[10px] h-8 px-2.5 cursor-pointer">
                          View
                        </Button>
                      </Link>
                      <Link href={`/dashboard/analytics/${poll.slug}`}>
                        <Button variant="secondary" size="sm" className="text-[10px] h-8 px-2.5 cursor-pointer">
                          Stats
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Activity */}
          <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-serif text-base font-normal tracking-tight text-fg flex items-center justify-between">
              <span>Recent Activity</span>
              {activeWorkspace && <Link href="/workspaces" className="text-xs text-brand-500 hover:underline">Members</Link>}
            </h3>
            <div className="text-muted-fg text-xs">Recent Activity Content Placeholder</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
