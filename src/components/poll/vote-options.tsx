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

/**
 * The ballot. Handles single and multiple choice layouts, as well as star rating
 * and 1-10 numerical scale selectors.
 */
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

  // Emoji Reactions Renderer
  if (type === "reactions") {
    return (
      <div className="space-y-4 py-2">
        <p className="text-center text-xs text-[var(--color-muted-fg)]">
          Tap an emoji to react and vote:
        </p>
        <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4">
          {sortedOptions.map((opt) => {
            const isSelected = selected.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                disabled={submitting}
                onClick={() => onToggle(opt.id)}
                className={cn(
                  "h-16 w-16 rounded-full border flex items-center justify-center text-3xl transition-all duration-200 cursor-pointer",
                  "hover:scale-110 active:scale-95 hover:bg-[var(--color-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-fg)]",
                  isSelected
                    ? "border-[var(--color-fg)] bg-[var(--color-subtle)] scale-110 shadow-md animate-pop"
                    : "border-[var(--color-border)] bg-[var(--color-bg)] shadow-sm",
                  "disabled:opacity-50 disabled:pointer-events-none"
                )}
                aria-label={`React with ${opt.text}`}
                title={opt.text}
              >
                {opt.text}
              </button>
            );
          })}
        </div>
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

  // Choice Options Ballot Renderer (with Image Grid support)
  const hasImages = options.some((o) => o.image_url);
  if (hasImages && (type === "single" || type === "multiple")) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sortedOptions.map((opt) => {
            const isSelected = selected.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                disabled={submitting}
                onClick={() => onToggle(opt.id)}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-200 cursor-pointer shadow-sm",
                  "hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--color-fg)]",
                  isSelected
                    ? "border-[var(--color-fg)] bg-[var(--color-subtle)] ring-1 ring-[var(--color-fg)]"
                    : "border-[var(--color-border)] bg-[var(--color-bg)]"
                )}
              >
                <div className="relative h-32 w-full bg-[var(--color-subtle)] border-b border-[var(--color-border)] flex items-center justify-center overflow-hidden">
                  {opt.image_url ? (
                    <img 
                      src={opt.image_url} 
                      alt={opt.text} 
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-[var(--color-muted-fg)] text-[10px]">No image URL</span>
                  )}
                </div>
                <div className="p-4 flex items-center justify-between gap-3 w-full">
                  <span className="font-semibold text-sm truncate">{opt.text}</span>
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center border transition-all duration-200",
                      multiple ? "rounded-md" : "rounded-full",
                      isSelected
                        ? "border-[var(--color-fg)] bg-[var(--color-fg)] text-[var(--color-bg)]"
                        : "border-[var(--color-border)] group-hover:border-[var(--color-fg)]"
                    )}
                  >
                    {isSelected && (
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                        <path
                          d="M3.5 8.5l3 3 6-7"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {multiple && (
          <Button
            className="mt-4 w-full h-11"
            size="lg"
            disabled={submitting || selected.length === 0}
            onClick={() => onSubmit()}
          >
            {submitting ? <Loader /> : null}
            {submitting ? "Submitting…" : "Submit vote"}
          </Button>
        )}
      </div>
    );
  }

  // Choice Options Ballot Renderer
  return (
    <div>
      <div
        role={multiple ? "group" : "radiogroup"}
        aria-label="Poll options"
        className="space-y-2.5"
      >
        {options.map((opt) => {
          const isSelected = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              role={multiple ? "checkbox" : "radio"}
              aria-checked={isSelected}
              disabled={submitting}
              onClick={() => onToggle(opt.id)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-[var(--radius)] border px-4 py-4 text-left transition-all duration-200 cursor-pointer",
                "hover:-translate-y-0.5 hover:border-[var(--color-fg)] hover:shadow-sm hover:bg-[var(--color-subtle)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-fg)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
                "disabled:pointer-events-none disabled:opacity-60",
                isSelected
                  ? "border-[var(--color-fg)] bg-[var(--color-subtle)] shadow-sm"
                  : "border-[var(--color-border)] bg-[var(--color-bg)]",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center border transition-all duration-200",
                  multiple ? "rounded-md" : "rounded-full",
                  isSelected
                    ? "border-[var(--color-fg)] bg-[var(--color-fg)] text-[var(--color-bg)] shadow-sm"
                    : "border-[var(--color-border)] group-hover:border-[var(--color-fg)]",
                )}
              >
                {isSelected && (
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                    <path
                      d="M3.5 8.5l3 3 6-7"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span className="font-medium">{opt.text}</span>
            </button>
          );
        })}
      </div>

      {multiple && (
        <Button
          className="mt-4 w-full"
          size="lg"
          disabled={submitting || selected.length === 0}
          onClick={() => onSubmit()}
        >
          {submitting ? <Loader /> : null}
          {submitting ? "Submitting…" : "Submit vote"}
        </Button>
      )}
    </div>
  );
}
