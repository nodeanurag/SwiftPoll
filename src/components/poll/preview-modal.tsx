import { useState, useMemo } from "react";
import type { OptionResult, PollType } from "@/types/poll";
import { Button } from "@/components/ui/button";
import { VoteOptions } from "./vote-options";
import { ResultsView } from "./results-view";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: string;
  options: string[];
  type: PollType;
  requireAuth: boolean;
}

export function PreviewModal({
  isOpen,
  onClose,
  question,
  options,
  type,
  requireAuth,
}: PreviewModalProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [voted, setVoted] = useState(false);
  const [viewResults, setViewResults] = useState(false);

  // Generate clean options list
  const optionResults = useMemo(() => {
    let finalOptions: string[] = options.map((o) => o.trim()).filter(Boolean);
    if (type === "rating") {
      finalOptions = ["1", "2", "3", "4", "5"];
    } else if (type === "scale") {
      finalOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    }

    if (finalOptions.length === 0 && type !== "rating" && type !== "scale") {
      finalOptions = ["Option 1", "Option 2"];
    }

    return finalOptions.map((text, idx) => ({
      id: `preview-opt-${idx}`,
      poll_id: "preview",
      text,
      position: idx,
      created_at: new Date().toISOString(),
      votes: 0,
      percentage: 0
    })) as OptionResult[];
  }, [options, type]);

  // Generate static random base counts to simulate prior votes
  const baseCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    optionResults.forEach((opt) => {
      // eslint-disable-next-line react-hooks/purity
      counts[opt.id] = Math.floor(Math.random() * 8) + 1;
    });
    return counts;
  }, [optionResults]);

  // Derive dynamic counts based on user's active choices
  const mockCounts = useMemo(() => {
    const counts = { ...baseCounts };
    if (voted) {
      selected.forEach((id) => {
        counts[id] = (counts[id] ?? 0) + 1;
      });
    }
    return counts;
  }, [baseCounts, selected, voted]);

  const mockTotal = useMemo(() => {
    return Object.values(mockCounts).reduce((a, b) => a + b, 0);
  }, [mockCounts]);

  if (!isOpen) return null;

  const cleanedQuestion = question.trim() || "Untitled Question";

  function handleToggle(id: string) {
    if (type === "single" || type === "rating" || type === "scale") {
      setSelected([id]);
      if (type === "rating" || type === "scale") {
        setVoted(true);
      }
    } else {
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    }
  }

  function handleSubmit() {
    if (type === "text") {
      if (optionResults[0]) {
        setSelected([optionResults[0].id]);
        setVoted(true);
      }
    } else if (selected.length > 0) {
      setVoted(true);
    }
  }

  function handleReset() {
    setSelected([]);
    setVoted(false);
    setViewResults(false);
  }

  const showResults = voted || viewResults;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg rounded-2xl bg-[var(--color-pure-white)] border border-[var(--color-border)] p-6 sm:p-8 shadow-2xl animate-scale-in flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md dark:bg-amber-950/20 dark:text-amber-400">
              Interactive Preview
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Close Preview"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-balance sm:text-2xl font-serif">
              {cleanedQuestion}
            </h2>

            {requireAuth && (
              <p className="text-[10px] text-[var(--color-muted-fg)] bg-[var(--color-subtle)] border border-[var(--color-border)] px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                🔒 Google sign-in required for this poll.
              </p>
            )}

            <div className="space-y-4 mt-2">
              {showResults ? (
                <div className="space-y-4">
                  <ResultsView
                    options={optionResults}
                    counts={mockCounts}
                    totalVotes={mockTotal}
                    myVotes={selected}
                    type={type}
                  />
                  <p className="text-center text-xs text-[var(--color-muted-fg)] italic">
                    Mock results computed from preview inputs.
                  </p>
                </div>
              ) : (
                <VoteOptions
                  options={optionResults}
                  type={type}
                  selected={selected}
                  submitting={false}
                  onToggle={handleToggle}
                  onSubmit={handleSubmit}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-4 mt-4 flex items-center justify-between gap-3">
          {showResults ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReset}
              className="text-xs h-9 cursor-pointer"
            >
              Reset Ballot
            </Button>
          ) : (
            !showResults && type !== "rating" && type !== "scale" && (
              <button
                type="button"
                onClick={() => setViewResults(true)}
                className="text-xs text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] underline underline-offset-4 cursor-pointer"
              >
                View results
              </button>
            )
          )}
          <Button
            onClick={onClose}
            className="ml-auto text-xs h-9 bg-[var(--color-fg)] text-[var(--color-bg)] cursor-pointer"
          >
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  );
}
