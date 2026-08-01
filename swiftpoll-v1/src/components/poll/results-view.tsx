import { computePercentage } from "@/lib/utils/percentage";
import type { OptionResult } from "@/types/poll";
import { ResultBar } from "./result-bar";

interface ResultsViewProps {
  options: OptionResult[];
  counts: Record<string, number>;
  totalVotes: number;
  myVotes: string[];
  type?: string;
  responses?: string[];
}

/** Renders all options as result bars, sorted by votes (desc). */
export function ResultsView({
  options,
  counts,
  totalVotes,
  myVotes,
  type,
  responses,
}: ResultsViewProps) {
  if (type === "text") {
    return (
      <div className="space-y-3">
        <p className="text-xs text-[var(--color-muted-fg)] font-medium">
          Voter responses ({responses?.length ?? 0}):
        </p>
        {responses && responses.length > 0 ? (
          <div className="max-h-[350px] overflow-y-auto space-y-2.5 pr-1">
            {responses.map((resp, idx) => (
              <div 
                key={idx} 
                className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-sm leading-relaxed"
              >
                {resp}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-[var(--color-muted-fg)] py-4">
            No responses yet.
          </p>
        )}
      </div>
    );
  }

  return null;
}
