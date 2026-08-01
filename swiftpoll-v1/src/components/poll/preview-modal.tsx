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

  return null;
}
