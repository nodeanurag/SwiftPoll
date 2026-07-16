"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader as LoaderIcon } from "lucide-react";
import { getBrowserClient } from "@/lib/supabase/client";
import { getAdminToken } from "@/lib/utils/fingerprint";
import type { AnalyticsOption } from "@/lib/actions/analytics";
import type { PollAnalyticsResult } from "@/lib/actions/analytics";

export interface AnalyticsAiSummaryProps {
  slug: string;
  totalVotes: number;
  views: number;
  completionRate: number;
  avgResponseSpeed: string;
  winnerOption: AnalyticsOption | null;
  votesPerOption: Record<string, number>;
  rawVotes: PollAnalyticsResult["votes"];
}

export function AnalyticsAiSummary({
  slug,
  totalVotes,
  views,
  completionRate,
  avgResponseSpeed,
  winnerOption,
  votesPerOption,
  rawVotes,
}: AnalyticsAiSummaryProps) {
  // AI Summary States
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<{
    winnerSummary?: string;
    trendsSummary?: string;
    commentsClustering?: string[];
  } | null>(null);
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null);

  const handleGenerateAiSummary = async () => {
    setAiSummaryLoading(true);
    setAiSummaryError(null);
    try {
      const supabase = getBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const sessionToken = session?.access_token;
      const adminToken = getAdminToken(slug) || undefined;

      const { generatePollSummaryAction } = await import("@/lib/actions/ai");
      const res = await generatePollSummaryAction(slug, adminToken, sessionToken);

      if (res.ok) {
        setAiSummary({
          winnerSummary: res.winnerSummary,
          trendsSummary: res.trendsSummary,
          commentsClustering: res.commentsClustering,
        });
      } else {
        if (res.error === "GEMINI_API_KEY_MISSING") {
          setAiSummary({
            winnerSummary: winnerOption 
              ? `"${winnerOption.text}" is currently leading with ${votesPerOption[winnerOption.id]} votes, representing ${((votesPerOption[winnerOption.id] ?? 0) / (totalVotes || 1) * 100).toFixed(0)}% of the total choices.`
              : "No winner could be determined as there are no votes cast on this poll yet.",
            trendsSummary: `A total turnout of ${totalVotes} responses was registered across ${views} page views, resulting in a completion rate of ${completionRate}%. The average response speed was ${avgResponseSpeed}.`,
            commentsClustering: rawVotes?.map(v => v.text_response).filter(Boolean).slice(0, 3) as string[] || []
          });
        } else {
          setAiSummaryError(res.error ?? "Failed to generate AI insights.");
        }
      }
    } catch {
      setAiSummaryError("Could not connect to AI service. Please try again.");
    } finally {
      setAiSummaryLoading(false);
    }
  };

  return <div>AnalyticsAiSummary Boilerplate</div>;
}
