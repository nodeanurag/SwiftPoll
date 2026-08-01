"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel, User } from "@supabase/supabase-js";
import { getBrowserClient } from "@/lib/supabase/client";
import { vote } from "@/lib/actions/vote";
import {
  getVotedOptions,
  getVoterId,
  markVoted,
} from "@/lib/utils/fingerprint";
import type { PollWithResults } from "@/types/poll";
import { Button } from "@/components/ui/button";
import { LiveBadge } from "./live-badge";
import { VoteOptions } from "./vote-options";
import { ResultsView } from "./results-view";

function buildCounts(poll: PollWithResults): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const opt of poll.options) counts[opt.id] = opt.votes;
  return counts;
}

export function PollView({ poll }: { poll: PollWithResults }) {
  return null;
}
