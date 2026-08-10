"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Calendar, ExternalLink, Vote, ArrowRight } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { LiveBadge } from "./live-badge";

interface RecentPollItem {
  id: string;
  slug: string;
  question: string;
  closed: boolean;
  closes_at: string | null;
  created_at: string;
  votes: { count: number }[];
  isLive?: boolean;
}

export function RecentPolls() {
  const [user, setUser] = useState<User | null>(null);
  const [polls, setPolls] = useState<RecentPollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getBrowserClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    let active = true;

    async function fetchRecentPolls() {
      setLoading(true);
      try {
        let query = supabase
          .from("polls")
          .select("id, slug, question, closed, closes_at, created_at, votes:votes(count)");

        if (user) {
          query = query.eq("user_id", user.id);
        } else {
          if (typeof window === "undefined") {
            if (active) setPolls([]);
            return;
          }
          const stored = localStorage.getItem("swiftpoll_created_polls_slugs");
          const slugs: string[] = stored ? JSON.parse(stored) : [];

          if (!slugs || slugs.length === 0) {
            if (active) {
              setPolls([]);
              setLoading(false);
            }
            return;
          }
          query = query.in("slug", slugs);
        }

        // Limit to last 10 polls
        const { data, error } = await query
          .order("created_at", { ascending: false })
          .limit(10);

        if (!error && data && active) {
          const now = Date.now();
          const mapped = (data as Record<string, unknown>[]).map((poll) => {
            const closes_at = poll.closes_at as string | null;
            const closed = poll.closed as boolean;
            const expired = closes_at 
              ? new Date(closes_at).getTime() <= now 
              : false;
            return {
              ...poll,
              isLive: !closed && !expired,
            } as RecentPollItem;
          });
          setPolls(mapped);
        }
      } catch (err) {
        console.error("Error loading recent polls:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchRecentPolls();

    return () => {
      active = false;
    };
  }, [user, supabase]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader className="h-5 w-5 text-[var(--color-brand-500)]" />
      </div>
    );
  }

  if (polls.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 pt-6 border-t border-[var(--color-border)] mt-8">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl font-normal">Your Recent Polls</h3>
        {user && (
          <Link 
            href="/dashboard" 
            className="text-xs font-semibold text-[var(--color-brand-500)] hover:underline flex items-center gap-1"
          >
            View Dashboard
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {polls.map((poll) => {
          const isLive = !!poll.isLive;
          const voteCount = poll.votes?.[0]?.count ?? 0;

          return (
            <Link 
              key={poll.id} 
              href={`/p/${poll.slug}`}
              className="group flex items-center justify-between p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] transition-all hover:border-[var(--color-brand-500)] hover:shadow-sm"
            >
              <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2.5">
                  <LiveBadge live={isLive} />
                  <span className="text-[10px] text-[var(--color-muted-fg)] uppercase tracking-wider font-semibold flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(poll.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric"
                    })}
                  </span>
                  <span className="text-[10px] text-[var(--color-muted-fg)] uppercase tracking-wider font-semibold flex items-center gap-1">
                    <Vote className="h-3 w-3" />
                    {voteCount} {voteCount === 1 ? "vote" : "votes"}
                  </span>
                </div>
                <h4 className="font-serif text-base font-normal truncate group-hover:text-[var(--color-brand-500)] transition-colors">
                  {poll.question}
                </h4>
              </div>
              <ExternalLink className="h-4 w-4 text-[var(--color-muted-fg)] group-hover:text-[var(--color-fg)] transition-colors shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
