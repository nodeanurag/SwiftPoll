"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useDashboard } from "@/context/dashboard-context";
import { 
  BarChart3, 
  Vote, 
  ExternalLink, 
  Loader,
  Trophy,
  ArrowUpRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AnalyticsPage() {
  const { polls, loadingPolls, currentTime } = useDashboard();
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Stats calculation
  const totalPolls = polls.length;
  const activePolls = polls.filter((p) => {
    const expired = p.closes_at ? new Date(p.closes_at).getTime() <= currentTime : false;
    return !p.closed && !expired;
  }).length;
  const totalVotes = polls.reduce((acc, p) => acc + (p.votes?.[0]?.count ?? 0), 0);

  // Sort polls by vote count descending for Top Polls
  const topPolls = useMemo(() => {
    return [...polls]
      .sort((a, b) => {
        const vA = a.votes?.[0]?.count ?? 0;
        const vB = b.votes?.[0]?.count ?? 0;
        return vB - vA;
      })
      .slice(0, 5);
  }, [polls]);

  // 30-day activity data calculation
  const activityData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = date.getDate().toString();
      
      const dayPolls = polls.filter(p => {
        const pDate = new Date(p.created_at);
        return pDate.getDate() === date.getDate() && pDate.getMonth() === date.getMonth();
      });
      
      const pollsCount = dayPolls.length;
      const votesCount = dayPolls.reduce((acc, p) => acc + (p.votes?.[0]?.count ?? 0), 0);
    }
    return [];
  }, [polls]);

  return null;
}
