import { cn } from "@/lib/utils/cn";

interface ResultBarProps {
  text: string;
  votes: number;
  percentage: number;
  isWinner: boolean;
  isMyVote: boolean;
  imageUrl?: string | null;
}

/** A single result row: label, animated fill bar, percentage and count. */
export function ResultBar({
  text,
  votes,
  percentage,
  isWinner,
  isMyVote,
  imageUrl,
}: ResultBarProps) {
  return (
    <div className="relative">
      <div
        className={cn(
          "relative overflow-hidden rounded-[var(--radius)] border px-4 py-4 transition-all duration-500",
          isWinner
            ? "border-[var(--color-brand-500)] shadow-md bg-[var(--color-subtle)]"
            : "border-[var(--color-border)] bg-[var(--color-bg)]",
        )}
      >
        {/* Animated fill */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 transition-all duration-1000 ease-out",
            isWinner 
              ? "bg-gradient-to-r from-purple-500/10 to-pink-500/15 dark:from-purple-500/20 dark:to-pink-500/25 shimmer-container" 
              : "bg-gradient-to-r from-[var(--color-border)]/30 to-[var(--color-border)]/50"
          )}
          style={{ width: `${Math.max(percentage, 0)}%` }}
          aria-hidden
        />
        <div className="relative flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 font-medium">
            {imageUrl && (
              <img 
                src={imageUrl} 
                alt={text} 
                className="h-10 w-10 shrink-0 object-cover rounded-md border border-[var(--color-border)]"
              />
            )}
            <span className="truncate">{text}</span>
            {isWinner && (
              <span className="shrink-0 text-xs" title="Leading Choice">
                👑
              </span>
            )}
            {isMyVote && (
              <span className="shrink-0 rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-semibold text-brand-600 dark:text-brand-400">
                Your vote
              </span>
            )}
          </span>
          <span className="shrink-0 tabular-nums text-sm text-[var(--color-muted-fg)]">
            <span className="font-semibold text-[var(--color-fg)]">
              {percentage}%
            </span>{" "}
            · {votes}
          </span>
        </div>
      </div>
    </div>
  );
}
