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
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    buildCounts(poll),
  );
  const [total, setTotal] = useState(poll.total_votes);
  const [isClosed, setIsClosed] = useState(poll.is_closed);

  const [myVotes, setMyVotes] = useState<string[]>([]);
  const [voted, setVoted] = useState(false);
  const [viewResults, setViewResults] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authenticated voter state
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | undefined>(undefined);

  const voterIdRef = useRef("");
  // Vote rows this client created — used to skip our own Realtime echoes.
  const ownVoteIds = useRef<Set<string>>(new Set());
  const mountTimeRef = useRef<number | null>(null);

  // Restore prior vote / identity from localStorage on mount.
  useEffect(() => {
    mountTimeRef.current = Date.now();
    voterIdRef.current = getVoterId();
    const prior = getVotedOptions(poll.slug);
    if (prior && prior.length) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setMyVotes(prior);
      setVoted(true);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [poll.slug]);

  // Handle active session tracking
  useEffect(() => {
    const supabase = getBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSessionToken(session?.access_token);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setSessionToken(session?.access_token);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    const supabase = getBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.href,
      },
    });
  };

  // Realtime: increment counts on new votes; track close/reopen live.
  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    try {
      const supabase = getBrowserClient();
      channel = supabase
        .channel(`poll-${poll.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "votes",
            filter: `poll_id=eq.${poll.id}`,
          },
          (payload) => {
            const row = payload.new as {
              id: string;
              option_id: string;
              voter_id: string | null;
              rank: number | null;
              text_response: string | null;
            };
            // Skip our own votes (already counted optimistically).
            if (ownVoteIds.current.has(row.id)) return;
            if (
              voterIdRef.current &&
              row.voter_id === voterIdRef.current
            ) {
              return;
            }
            if (poll.type === "ranking") {
              const r = row.rank ?? 0;
              const points = Math.max(poll.options.length - r, 0);
              setCounts((prev) => ({
                ...prev,
                [row.option_id]: (prev[row.option_id] ?? 0) + points,
              }));
              setTotal((t) => t + points);
            } else {
              setCounts((prev) => ({
                ...prev,
                [row.option_id]: (prev[row.option_id] ?? 0) + 1,
              }));
              setTotal((t) => t + 1);
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "polls",
            filter: `id=eq.${poll.id}`,
          },
          (payload) => {
            const row = payload.new as { closed: boolean; closes_at: string | null; question?: string };
            const expired = row.closes_at
              ? new Date(row.closes_at).getTime() <= Date.now()
              : false;
            setIsClosed(row.closed || expired);
            if (row.question && row.question !== poll.question) {
              router.refresh();
            }
          },
        )
        .subscribe();
    } catch {
      // Supabase not configured / unreachable
    }

    return () => {
      if (channel) channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poll.id]);

  return null;
}
