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
  const [password, setPassword] = useState("");
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setVerifyingPassword(true);
    setPasswordError(null);
    const { verifyPollPassword } = await import("@/lib/actions/vote");
    const res = await verifyPollPassword(poll.slug, password);
    setVerifyingPassword(false);
    if (res.ok) {
      setPasswordVerified(true);
    } else {
      setPasswordError("Incorrect password.");
    }
  };

  if (poll.require_password && !passwordVerified) {
    return (
      <div className="rounded-[var(--radius)] border p-6 text-center space-y-4 bg-[var(--color-card)] border-[var(--color-border)] max-w-sm mx-auto">
        <div className="text-3xl">🔑</div>
        <div className="space-y-1">
          <h3 className="font-serif text-lg font-normal">Password Protected Poll</h3>
          <p className="text-xs text-[var(--color-muted-fg)] leading-relaxed">
            Enter the password to view this poll and cast your vote.
          </p>
        </div>
        <form onSubmit={handleVerifyPassword} className="space-y-3">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-fg)]"
          />
          {passwordError && (
            <p className="text-xs text-red-600 text-left">{passwordError}</p>
          )}
          <Button
            type="submit"
            disabled={verifyingPassword}
            className="w-full flex items-center justify-center bg-[var(--color-fg)] text-[var(--color-bg)] hover:bg-[var(--color-muted-fg)] cursor-pointer"
          >
            {verifyingPassword ? "Loading..." : "Unlock Poll"}
          </Button>
        </form>
      </div>
    );
  }

  return <PollViewContent poll={poll} voterPassword={password} />;
}

function PollViewContent({ poll, voterPassword }: { poll: PollWithResults; voterPassword?: string }) {
  return null;
}
