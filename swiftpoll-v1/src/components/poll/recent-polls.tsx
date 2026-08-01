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
  return null;
}
