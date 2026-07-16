"use client";

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { BarChart3, PieChart } from "lucide-react";
import type { AnalyticsOption } from "@/lib/actions/analytics";

export interface AnalyticsChartsProps {
  totalVotes: number;
  sortedOptions: AnalyticsOption[];
  votesPerOption: Record<string, number>;
}

export function AnalyticsCharts({
  totalVotes,
  sortedOptions,
  votesPerOption,
}: AnalyticsChartsProps) {
  const [chartType, setChartType] = useState<"bar" | "donut">("bar");

  // Donut chart path layout helpers
  const donutSegments = useMemo(() => {
    if (totalVotes === 0 || !sortedOptions.length) return [];
    
    let currentAngle = 0;
    const colors = [
      "var(--color-brand-600)",
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ec4899",
      "#8b5cf6",
      "#06b6d4",
      "#84cc16",
    ];

    return sortedOptions.map((opt, i) => {
      const count = votesPerOption[opt.id] ?? 0;
      const percentage = (count / totalVotes) * 100;
      const angle = (count / totalVotes) * 360;

      // Circle layout mathematics
      const r = 50;
      const cx = 60;
      const cy = 60;
      
      const x1 = cx + r * Math.cos((currentAngle - 90) * Math.PI / 180);
      const y1 = cy + r * Math.sin((currentAngle - 90) * Math.PI / 180);
      
      currentAngle += angle;
      
      const x2 = cx + r * Math.cos((currentAngle - 90) * Math.PI / 180);
      const y2 = cy + r * Math.sin((currentAngle - 90) * Math.PI / 180);

      const largeArc = angle > 180 ? 1 : 0;
      const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      return {
        pathData,
        color: colors[i % colors.length],
        percentage: percentage.toFixed(1),
        text: opt.text,
        count
      };
    });
  }, [sortedOptions, votesPerOption, totalVotes]);

  return (
    <Card className="p-6 space-y-6 shadow-sm bg-card text-fg border border-border">
      <div className="flex justify-between items-center flex-wrap gap-3 border-b pb-4 border-[var(--color-border)]">
        <div>
          <h3 className="font-serif text-lg font-normal text-fg">Response Share</h3>
          <p className="text-xs text-[var(--color-muted-fg)]">Percentage spread of vote outcomes</p>
        </div>
        <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-subtle)] p-0.5">
          <button
            onClick={() => setChartType("bar")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1 transition-all duration-200 cursor-pointer ${
              chartType === "bar" 
                ? "bg-[var(--color-card)] text-[var(--color-fg)] shadow-sm border border-[var(--color-border)]" 
                : "text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Bar View
          </button>
          <button
            onClick={() => setChartType("donut")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1 transition-all duration-200 cursor-pointer ${
              chartType === "donut" 
                ? "bg-[var(--color-card)] text-[var(--color-fg)] shadow-sm border border-[var(--color-border)]" 
                : "text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
            }`}
          >
            <PieChart className="h-3.5 w-3.5" />
            Donut View
          </button>
        </div>
      </div>

      {totalVotes === 0 ? (
        <div className="py-16 text-center space-y-2">
          <p className="text-sm font-medium text-[var(--color-muted-fg)]">Awaiting responses</p>
          <p className="text-xs text-[var(--color-muted-fg)] max-w-xs mx-auto leading-relaxed">
            No votes have been cast on this poll yet. Once voters submit their choices, charts will update instantly.
          </p>
        </div>
      ) : chartType === "bar" ? (
        <div className="space-y-4 py-2">
          {sortedOptions.map((opt) => {
            const count = votesPerOption[opt.id] ?? 0;
            const percentage = (count / totalVotes) * 100;
            return (
              <div key={opt.id} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="truncate pr-4 text-fg">{opt.text}</span>
                  <span className="text-fg">{count} vote{count !== 1 ? "s" : ""} ({percentage.toFixed(0)}%)</span>
                </div>
                <div className="h-7 w-full bg-[var(--color-subtle)] rounded-md overflow-hidden relative border border-[var(--color-border)]">
                  <div 
                    className="h-full bg-[var(--color-brand-600)] transition-all duration-700 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
          <svg viewBox="0 0 120 120" className="h-44 w-44 md:h-52 md:w-52 transform -rotate-90">
            {donutSegments.map((seg, i) => (
              <path
                key={i}
                d={seg.pathData}
                fill={seg.color}
                className="transition-transform duration-300 hover:scale-105"
              />
            ))}
          </svg>
          <div className="space-y-2.5 max-w-sm w-full">
            {donutSegments.map((seg, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0 pr-4">
                  <div className="h-3.5 w-3.5 shrink-0 rounded" style={{ backgroundColor: seg.color }} />
                  <span className="truncate font-medium text-fg">{seg.text}</span>
                </div>
                <span className="shrink-0 text-[var(--color-muted-fg)] font-medium">
                  {seg.count} ({seg.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
