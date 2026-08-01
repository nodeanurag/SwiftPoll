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
  if (!isOpen) return null;
  return null;
}
