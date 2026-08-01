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

  // 1. Star Rating Renderer
  if (type === "rating") {
    return (
      <div className="space-y-4 py-2">
        <p className="text-center text-xs text-[var(--color-muted-fg)]">
          Select a star rating below to submit your vote:
        </p>
        <div className="flex justify-center items-center gap-1.5 sm:gap-2">
          {sortedOptions.map((opt, index) => {
            const starValue = index + 1;
            const isHighlighted = hoveredStar !== null ? starValue <= hoveredStar : false;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={submitting}
                onMouseEnter={() => setHoveredStar(starValue)}
                onMouseLeave={() => setHoveredStar(null)}
                onClick={() => onToggle(opt.id)}
                className="p-1 cursor-pointer transition-all duration-300 hover:scale-125 focus:outline-none disabled:opacity-50 disabled:pointer-events-none"
                style={{
                  filter: isHighlighted ? "drop-shadow(0 0 8px rgba(245, 158, 11, 0.5))" : "none"
                }}
                aria-label={`Rate ${starValue} Stars`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={isHighlighted ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn(
                    "h-10 w-10 sm:h-12 sm:w-12 transition-colors duration-150",
                    isHighlighted 
                      ? "text-amber-500 fill-amber-500" 
                      : "text-[var(--color-border)] hover:text-amber-500"
                  )}
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. Numerical 1-10 Scale Renderer
  if (type === "scale") {
    return (
      <div className="space-y-4 py-2">
        <p className="text-center text-xs text-[var(--color-muted-fg)]">
          Pick a score from 1 to 10 to vote:
        </p>
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center items-center gap-2">
            {sortedOptions.map((opt, index) => {
              const scoreValue = index + 1;
              const isSelected = selected.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={submitting}
                  onClick={() => onToggle(opt.id)}
                  className={cn(
                    "h-10 w-10 sm:h-12 sm:w-12 rounded-full border flex items-center justify-center font-medium text-xs sm:text-sm transition-all duration-200 cursor-pointer shadow-sm",
                    "hover:scale-110 active:scale-95 hover:border-[var(--color-fg)] hover:bg-[var(--color-subtle)] hover:shadow-md",
                    isSelected
                      ? "border-[var(--color-fg)] bg-[var(--color-fg)] text-[var(--color-bg)] font-bold scale-110"
                      : "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]",
                    "disabled:opacity-50 disabled:pointer-events-none"
                  )}
                >
                  {scoreValue}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between w-full max-w-[440px] text-[10px] sm:text-xs text-[var(--color-muted-fg)] px-2 font-medium">
            <span>Low (1)</span>
            <span>High (10)</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
