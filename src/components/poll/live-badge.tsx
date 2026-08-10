import { cn } from "@/lib/utils/cn";

/** Small "LIVE" indicator with a pulsing dot, or a static "Closed" pill. */
export function LiveBadge({ live }: { live: boolean }) {
  if (!live) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--color-muted-fg)]">
        Closed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-600 dark:text-green-400">
      <span className={cn("h-2 w-2 rounded-full bg-green-500 animate-pulse-ring")} />
      LIVE
    </span>
  );
}
