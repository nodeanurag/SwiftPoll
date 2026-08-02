"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDashboard } from "@/context/dashboard-context";
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
        </div>
      </section>
    </div>
  );
}
