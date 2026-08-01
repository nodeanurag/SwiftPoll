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

  return null;
}
