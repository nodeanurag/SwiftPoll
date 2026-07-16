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

  return (
    <Card className="p-6 space-y-4 border border-brand-500/20 bg-brand-500/5 dark:bg-brand-900/5 shadow-sm relative overflow-hidden">
      {/* Subtle decorative glow */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />

      <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="flex gap-3">
          <span className="text-xl">✨</span>
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-normal text-brand-900 dark:text-brand-100 flex items-center gap-1.5">
              AI Smart Summarizer
            </h3>
            <p className="text-xs text-[var(--color-muted-fg)] leading-relaxed max-w-xl">
              Get an automated overview explaining choice margins, voter patterns, and clustered commentary feedback.
            </p>
          </div>
        </div>
        <Button
          onClick={handleGenerateAiSummary}
          disabled={aiSummaryLoading || totalVotes === 0}
          className="text-xs gap-1.5 shrink-0 bg-[var(--color-fg)] text-[var(--color-bg)] hover:bg-[var(--color-muted-fg)] cursor-pointer font-medium"
          size="sm"
        >
          {aiSummaryLoading ? <LoaderIcon className="h-3.5 w-3.5 animate-spin" /> : "⚡"}
          {aiSummaryLoading ? "Analyzing..." : "Generate AI Insights"}
        </Button>
      </div>

      {aiSummaryError && (
        <p className="text-xs text-red-600 mt-2 font-medium">{aiSummaryError}</p>
      )}

      {aiSummary && (
        <div className="mt-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] space-y-4 text-sm leading-relaxed animate-fade-in-up">
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-brand-600">Choice Winner Insights</span>
              <p className="text-sm font-medium text-[var(--color-fg)]">{aiSummary.winnerSummary}</p>
            </div>
            <div className="h-px bg-[var(--color-border)] w-full" />
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-brand-600">Turnout & Patterns</span>
              <p className="text-sm text-[var(--color-muted-fg)]">{aiSummary.trendsSummary}</p>
            </div>
            {aiSummary.commentsClustering && aiSummary.commentsClustering.length > 0 && (
              <>
                <div className="h-px bg-[var(--color-border)] w-full" />
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-brand-600">Voter Feedback Clusters</span>
                  <ul className="list-disc pl-4 space-y-1.5 text-xs text-[var(--color-muted-fg)]">
                    {aiSummary.commentsClustering.map((cluster, i) => (
                      <li key={i}>{cluster}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
