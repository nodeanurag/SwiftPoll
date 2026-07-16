"use client";

import React from "react";
import { Card } from "@/components/ui/card";

export interface AnalyticsTimelineProps {
  totalVotes: number;
  timelineData: { label: string; count: number }[];
}

export function AnalyticsTimeline({
  totalVotes,
  timelineData,
}: AnalyticsTimelineProps) {
  return (
    <Card className="p-6 space-y-4 shadow-sm bg-card text-fg border border-border">
      <div>
        <h3 className="font-serif text-lg font-normal text-fg">Voting Activity Timeline</h3>
        <p className="text-xs text-[var(--color-muted-fg)]">
          Hourly votes registered over the last 24 hours (or daily for the last 7 days)
        </p>
      </div>
      {totalVotes === 0 ? (
        <p className="py-12 text-center text-xs text-[var(--color-muted-fg)]">No voting activity recorded yet.</p>
      ) : (
        <div className="pt-4">
          {/* SVG Area Chart */}
          {(() => {
            const maxCount = Math.max(...timelineData.map(d => d.count), 1);
            const chartHeight = 140;
            const chartWidth = 720;
            const points = timelineData.map((d, index) => {
              const x = (index / (timelineData.length - 1)) * (chartWidth - 40) + 20;
              const y = chartHeight - 25 - (d.count / maxCount) * (chartHeight - 50);
              return { x, y, label: d.label, count: d.count };
            });

            const pathD = points.length 
              ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
              : "";
              
            const areaD = points.length
              ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - 25} L ${points[0].x} ${chartHeight - 25} Z`
              : "";

            return (
              <div className="space-y-4">
                <div className="relative w-full overflow-x-auto">
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full min-w-[500px] h-36 overflow-visible">
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-brand-600)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="var(--color-brand-600)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Grid Lines */}
                    <line x1="20" y1="25" x2={chartWidth - 20} y2="25" stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="3 3" />
                    <line x1="20" y1={chartHeight - 25} x2={chartWidth - 20} y2={chartHeight - 25} stroke="var(--color-border)" strokeWidth="1" />

                    {/* Area Fill */}
                    <path d={areaD} fill="url(#areaGradient)" />

                    {/* Path Line */}
                    <path d={pathD} fill="none" stroke="var(--color-brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Dots and Tooltips */}
                    {points.map((p, idx) => (
                      <g key={idx} className="group">
                        {p.count > 0 && (
                          <circle cx={p.x} cy={p.y} r="3.5" fill="var(--color-brand-600)" stroke="var(--color-card)" strokeWidth="1" />
                        )}
                        <circle cx={p.x} cy={p.y} r="8" fill="transparent" className="cursor-pointer" />
                        <title>{`${p.count} vote${p.count !== 1 ? 's' : ''} at ${p.label}`}</title>
                      </g>
                    ))}

                    {/* X Axis Labels */}
                    {points.filter((_, idx) => idx % (timelineData.length > 10 ? 3 : 1) === 0).map((p, idx) => (
                      <text key={idx} x={p.x} y={chartHeight - 6} textAnchor="middle" className="text-[9px] fill-[var(--color-muted-fg)] font-semibold">
                        {p.label}
                      </text>
                    ))}
                  </svg>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </Card>
  );
}
