"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "@/context/dashboard-context";

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

  return (
    <div className="flex-1 min-w-0 flex flex-col max-w-[1600px] w-full mx-auto px-6 sm:px-8 py-6">
      <div className="text-white">
        Welcome back, {user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Creator"}
      </div>
    </div>
  );
}
