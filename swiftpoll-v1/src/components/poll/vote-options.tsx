"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { OptionResult, PollType } from "@/types/poll";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";

interface VoteOptionsProps {
  options: OptionResult[];
  type: PollType;
  selected: string[];
  submitting: boolean;
  onToggle: (optionId: string) => void;
  onSubmit: (textResponse?: string) => void;
}

export function VoteOptions({
  options,
  type,
  selected,
  submitting,
  onToggle,
  onSubmit,
}: VoteOptionsProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [textVal, setTextVal] = useState("");
  const multiple = type === "multiple";

  const sortedOptions = [...options].sort((a, b) => a.position - b.position);

  // 1. Text Response Renderer
  if (type === "text") {
    return (
      <div className="space-y-4">
        <p className="text-center text-xs text-[var(--color-muted-fg)] font-medium">
          Type your response below to submit:
        </p>
        <textarea
          value={textVal}
          onChange={(e) => setTextVal(e.target.value)}
          placeholder="Type your answer..."
          maxLength={500}
          disabled={submitting}
          className="w-full min-h-[120px] p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-fg)] resize-y"
        />
        <Button
          className="w-full h-11"
          size="lg"
          disabled={submitting || !textVal.trim()}
          onClick={() => {
            if (options[0]) {
              onToggle(options[0].id);
              onSubmit(textVal);
            }
          }}
        >
          {submitting ? <Loader /> : null}
          {submitting ? "Submitting…" : "Submit response"}
        </Button>
      </div>
    );
  }

  // 2. Ranking Preferences Renderer
  if (type === "ranking") {
    const getOptionRank = (id: string) => {
      const idx = selected.indexOf(id);
      return idx !== -1 ? idx + 1 : null;
    };

    return (
      <div className="space-y-4">
        <p className="text-center text-xs text-[var(--color-muted-fg)] font-medium">
          Click options in order of your preference to rank them (1st, 2nd, etc.):
        </p>
        <div className="space-y-2.5">
          {sortedOptions.map((opt) => {
            const rank = getOptionRank(opt.id);
            const isSel = rank !== null;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={submitting}
                onClick={() => onToggle(opt.id)}
                className={cn(
                  "group flex w-full items-center justify-between rounded-[var(--radius)] border px-4 py-4 text-left transition-all duration-200 cursor-pointer",
                  "hover:-translate-y-0.5 hover:border-[var(--color-fg)] hover:bg-[var(--color-subtle)]",
                  isSel
                    ? "border-[var(--color-fg)] bg-[var(--color-subtle)] shadow-sm"
                    : "border-[var(--color-border)] bg-[var(--color-bg)]",
                )}
              >
                <span className="font-semibold text-sm">{opt.text}</span>
                <div className="flex items-center gap-2">
                  {isSel ? (
                    <span className="h-7 px-3 rounded-full bg-[var(--color-fg)] text-[var(--color-bg)] text-[10px] font-bold flex items-center justify-center shadow-sm">
                      Rank {rank}
                    </span>
                  ) : (
                    <span className="h-7 px-3 rounded-full border border-dashed border-[var(--color-border)] text-[var(--color-muted-fg)] text-[10px] flex items-center justify-center group-hover:border-[var(--color-fg)] group-hover:text-[var(--color-fg)]">
                      Unranked
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <Button
          className="mt-4 w-full h-11"
          size="lg"
          disabled={submitting || selected.length === 0}
          onClick={() => onSubmit()}
        >
          {submitting ? <Loader /> : null}
          {submitting ? "Submitting…" : "Submit ranking"}
        </Button>
      </div>
    );
  }

  return null;
}
