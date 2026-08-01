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

  return null;
}
