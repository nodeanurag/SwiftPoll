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

/** Renders all options as result bars, sorted by votes (desc). */
export function ResultsView({
  options,
  counts,
  totalVotes,
  myVotes,
  type,
  responses,
}: ResultsViewProps) {
  return null;
}
