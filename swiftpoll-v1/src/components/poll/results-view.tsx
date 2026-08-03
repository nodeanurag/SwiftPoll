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

  const ranked = [...options].sort((a, b) => {
    if (type === "rating" || type === "scale" || type === "reactions") {
      return a.position - b.position;
    }
    const av = counts[a.id] ?? 0;
    const bv = counts[b.id] ?? 0;
    if (bv !== av) return bv - av;
    return a.position - b.position;
  });
  const topVotes = ranked.length ? counts[ranked[0].id] ?? 0 : 0;

  return (
    <div className="space-y-2.5" aria-live="polite">
      {ranked.map((opt) => {
        const votes = counts[opt.id] ?? 0;
        const textLabel = type === "rating" ? `${opt.text} Star${opt.text !== "1" ? "s" : ""}` : opt.text;
        return (
          <ResultBar
            key={opt.id}
            text={textLabel}
            votes={votes}
            percentage={computePercentage(votes, totalVotes)}
            isWinner={totalVotes > 0 && votes === topVotes}
            isMyVote={myVotes.includes(opt.id)}
            imageUrl={opt.image_url}
          />
        );
      })}
    </div>
  );
}
