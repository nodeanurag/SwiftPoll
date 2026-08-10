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

  // Restore prior vote / identity from localStorage on mount. These values only
  // exist in the browser, so reading them post-hydration (here) is correct;
  // the lint rule against setState-in-effect is a false positive for this case.
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
      // Supabase not configured / unreachable — page still works, just no live updates.
    }

    return () => {
      if (channel) channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poll.id]);

  const submitVotes = useCallback(
    async (optionIds: string[], textResponse?: string, ranks?: Record<string, number>) => {
      if (submitting || optionIds.length === 0) return;
      setSubmitting(true);
      setError(null);

      // Optimistic update.
      if (poll.type !== "text") {
        setCounts((prev) => {
          const next = { ...prev };
          for (let i = 0; i < optionIds.length; i++) {
            const id = optionIds[i];
            const pts = poll.type === "ranking" ? Math.max(poll.options.length - (ranks?.[id] ?? 0), 0) : 1;
            next[id] = (next[id] ?? 0) + pts;
          }
          return next;
        });
        const addTotal = poll.type === "ranking" ? optionIds.reduce((sum, id) => sum + Math.max(poll.options.length - (ranks?.[id] ?? 0), 0), 0) : optionIds.length;
        setTotal((t) => t + addTotal);
      }
      setMyVotes(optionIds);
      setVoted(true);

      const durationMs = mountTimeRef.current !== null ? Date.now() - mountTimeRef.current : undefined;
      const res = await vote({
        slug: poll.slug,
        optionIds,
        voterId: voterIdRef.current || undefined,
        textResponse,
        ranks,
        password: voterPassword || undefined,
        durationMs,
      }, sessionToken);

      if (!res.ok) {
        // Roll back the optimistic update.
        setCounts((prev) => {
          const next = { ...prev };
          for (const id of optionIds) next[id] = Math.max((next[id] ?? 1) - 1, 0);
          return next;
        });
        setTotal((t) => Math.max(t - optionIds.length, 0));
        setMyVotes([]);
        setVoted(false);
        setSubmitting(false);
        setError(res.error ?? "Could not record your vote.");
        return;
      }

      for (const id of res.voteIds ?? []) ownVoteIds.current.add(id);
      markVoted(poll.slug, optionIds);
      setSubmitting(false);
    },
    [poll.slug, poll.type, poll.options.length, submitting, voterPassword, sessionToken],
  );

  function onToggle(optionId: string) {
    setError(null);
    if (poll.type === "single" || poll.type === "rating" || poll.type === "scale" || poll.type === "reactions") {
      setSelected([optionId]);
      void submitVotes([optionId]);
      return;
    }
    if (poll.type === "ranking") {
      setSelected((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
      return;
    }
    setSelected((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId],
    );
  }

  const hideResultsForVoter = poll.hide_results_until_close && !isClosed;
  const showResults = (voted || isClosed || viewResults) && !hideResultsForVoter;
  const canSkipToResults = !poll.hide_results && !isClosed && !voted && !poll.hide_results_until_close;

  const averageScore = useMemo(() => {
    if (total === 0) return 0;
    if (poll.type !== "rating" && poll.type !== "scale") return 0;

    let sum = 0;
    const sorted = [...poll.options].sort((a, b) => a.position - b.position);
    sorted.forEach((opt, index) => {
      const val = index + 1;
      const count = counts[opt.id] ?? 0;
      sum += val * count;
    });

    return Number((sum / total).toFixed(1));
  }, [poll.options, poll.type, counts, total]);

  const totalLabel = useMemo(
    () => `${total} ${total === 1 ? "vote" : "votes"}`,
    [total],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[var(--color-muted-fg)]">
          {totalLabel}
          {poll.type === "multiple" && " · choose one or more"}
          {poll.type === "rating" && total > 0 && ` · Average: ${averageScore} / 5 Stars`}
          {poll.type === "scale" && total > 0 && ` · Average Score: ${averageScore} / 10`}
        </span>
        <LiveBadge live={!isClosed} />
      </div>

      {isClosed && !voted && (
        <p className="rounded-[var(--radius)] bg-[var(--color-subtle)] px-4 py-2.5 text-sm text-[var(--color-muted-fg)]">
          This poll is closed. Here are the final results.
        </p>
      )}

      {voted && poll.hide_results_until_close && !isClosed && (
        <p className="rounded-[var(--radius)] bg-[var(--color-subtle)] px-4 py-2.5 text-sm text-[var(--color-muted-fg)]">
          Thanks for voting! Results are hidden until this poll closes.
        </p>
      )}

      {showResults ? (
        <ResultsView
          options={poll.options}
          counts={counts}
          totalVotes={total}
          myVotes={myVotes}
          type={poll.type}
        />
      ) : poll.require_auth && !user ? (
        <div className="rounded-[var(--radius)] border border-dashed p-6 text-center space-y-4 bg-[var(--color-card)] border-[var(--color-border)]">
          <div className="text-3xl">🔒</div>
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-normal">Signed-in Users Only</h3>
            <p className="text-xs text-[var(--color-muted-fg)] max-w-sm mx-auto leading-relaxed">
              The creator of this poll requires voters to sign in with a Google account to prevent spam and double-voting.
            </p>
          </div>
          <Button
            onClick={handleGoogleSignIn}
            className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 border-[var(--color-border)] shadow-sm bg-[var(--color-fg)] text-[var(--color-bg)] cursor-pointer hover:bg-[var(--color-muted-fg)] transition-all"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </Button>
        </div>
      ) : (
        <VoteOptions
          options={poll.options}
          type={poll.type}
          selected={selected}
          submitting={submitting}
          onToggle={onToggle}
          onSubmit={(textResponse) => {
            const ranks: Record<string, number> = {};
            if (poll.type === "ranking") {
              selected.forEach((id, idx) => {
                ranks[id] = idx;
              });
              submitVotes(selected, textResponse, ranks);
            } else if (poll.type === "text" && poll.options[0]) {
              submitVotes([poll.options[0].id], textResponse, ranks);
            } else {
              submitVotes(selected, textResponse, ranks);
            }
          }}
        />
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {canSkipToResults && (
        <button
          type="button"
          onClick={() => setViewResults(true)}
          className="mx-auto block text-sm text-[var(--color-muted-fg)] underline-offset-4 hover:text-[var(--color-fg)] hover:underline"
        >
          View results without voting
        </button>
      )}

      {voted && (
        <p className="text-center text-sm text-green-600 dark:text-green-400 animate-fade-in-up">
          Thanks for voting! Results update live.
        </p>
      )}

      {viewResults && !voted && !isClosed && (
        <Button
          variant="secondary"
          className="w-full font-medium"
          onClick={() => setViewResults(false)}
        >
          Back to voting
        </Button>
      )}
    </div>
  );
}
