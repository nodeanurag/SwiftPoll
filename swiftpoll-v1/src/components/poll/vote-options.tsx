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
  return null;
}
