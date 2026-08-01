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

  return null;
}
