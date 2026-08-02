"use client";

import { useState } from "react";
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

  return (
    <div className="flex-1 min-w-0 flex flex-col max-w-[1600px] w-full mx-auto px-6 sm:px-8 py-6">
      <div className="text-white">
        Welcome back, {user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Creator"}
      </div>
    </div>
  );
}
