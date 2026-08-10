"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import type { AnalyticsOption, PollAnalyticsResult } from "@/lib/actions/analytics";

export interface AnalyticsActivityLogProps {
  totalVotes: number;
  votes: PollAnalyticsResult["votes"];
  options: AnalyticsOption[];
}

export function AnalyticsActivityLog({
  totalVotes,
  votes,
  options,
}: AnalyticsActivityLogProps) {
  const optMap: Record<string, string> = {};
  options?.forEach(o => { optMap[o.id] = o.text; });

  return (
    <Card className="p-6 space-y-4 shadow-sm bg-card text-fg border border-border">
      <div>
        <h3 className="font-serif text-lg font-normal text-fg">Recent Activity Log</h3>
        <p className="text-xs text-[var(--color-muted-fg)]">Sequential stream of votes registered</p>
      </div>

      {totalVotes === 0 ? (
        <p className="py-6 text-center text-xs text-[var(--color-muted-fg)]">No logs available</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-fg">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-muted-fg)]">
                <th className="py-2.5 font-medium">Timestamp</th>
                <th className="py-2.5 font-medium">Selected Option</th>
                <th className="py-2.5 font-medium text-right">Voter ID</th>
              </tr>
            </thead>
            <tbody>
              {votes?.slice(-15).reverse().map((vote) => {
                return (
                  <tr key={vote.id} className="border-b border-[var(--color-border)] last:border-none">
                    <td className="py-3 text-[var(--color-muted-fg)]">
                      {new Date(vote.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 font-medium">
                      {optMap[vote.option_id] || "Unknown Option"}
                    </td>
                    <td className="py-3 text-right font-mono text-[var(--color-muted-fg)]">
                      {vote.voter_id ? `${vote.voter_id.substring(0, 8)}…` : "Guest"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
