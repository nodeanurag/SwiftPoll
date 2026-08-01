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
  return null;
}
