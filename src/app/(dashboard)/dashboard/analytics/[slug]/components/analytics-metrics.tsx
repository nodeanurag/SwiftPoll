"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, Award, Clock, BarChart3 } from "lucide-react";
import type { AnalyticsOption } from "@/lib/actions/analytics";

export interface AnalyticsMetricsProps {
  totalVotes: number;
  views: number;
  completionRate: number;
  winnerOption: AnalyticsOption | null;
  votesPerOption: Record<string, number>;
  peakHour: string;
  avgResponseSpeed: string;
}

export function AnalyticsMetrics({
  totalVotes,
  views,
  completionRate,
  winnerOption,
  votesPerOption,
  peakHour,
  avgResponseSpeed,
}: AnalyticsMetricsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="p-4 flex flex-col justify-between space-y-3 shadow-sm bg-card text-fg border border-border">
        <div className="flex justify-between items-center text-[var(--color-muted-fg)]">
          <span className="text-xs font-medium">Turnout</span>
          <TrendingUp className="h-4 w-4" />
        </div>
        <div>
          <div className="text-2xl font-serif text-fg">{totalVotes} votes</div>
          <div className="text-[10px] text-[var(--color-muted-fg)]">
            {views} views · {completionRate}% rate
          </div>
        </div>
      </Card>

      <Card className="p-4 flex flex-col justify-between space-y-3 shadow-sm bg-card text-fg border border-border">
        <div className="flex justify-between items-center text-[var(--color-muted-fg)]">
          <span className="text-xs font-medium">Leading Choice</span>
          <Award className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate text-fg">
            {winnerOption ? winnerOption.text : "No votes"}
          </div>
          <div className="text-[10px] text-[var(--color-muted-fg)]">
            {winnerOption 
              ? `${((votesPerOption[winnerOption.id] ?? 0) / (totalVotes || 1) * 100).toFixed(0)}% of responses` 
              : "Awaiting votes"}
          </div>
        </div>
      </Card>

      <Card className="p-4 flex flex-col justify-between space-y-3 shadow-sm bg-card text-fg border border-border">
        <div className="flex justify-between items-center text-[var(--color-muted-fg)]">
          <span className="text-xs font-medium">Peak Hour</span>
          <Clock className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold truncate text-fg">{peakHour}</div>
          <div className="text-[10px] text-[var(--color-muted-fg)]">Most active hour</div>
        </div>
      </Card>

      <Card className="p-4 flex flex-col justify-between space-y-3 shadow-sm bg-card text-fg border border-border">
        <div className="flex justify-between items-center text-[var(--color-muted-fg)]">
          <span className="text-xs font-medium">Average Speed</span>
          <BarChart3 className="h-4 w-4" />
        </div>
        <div>
          <div className="text-2xl font-serif text-fg">{avgResponseSpeed}</div>
          <div className="text-[10px] text-[var(--color-muted-fg)]">
            Page-load to vote cast
          </div>
        </div>
      </Card>
    </div>
  );
}
