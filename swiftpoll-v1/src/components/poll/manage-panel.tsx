"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { managePoll, editPollQuestion } from "@/lib/actions/manage-poll";
import { clearAdminToken, getAdminToken } from "@/lib/utils/fingerprint";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { getBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * Creator-only controls. Renders nothing unless this browser holds the poll's
 * admin token (saved in localStorage at creation time) or the current user is
 * the authenticated owner of the poll. The credentials are verified server-side on every action.
 */
export function ManagePanel({
  slug,
  isClosed,
  pollUserId,
  createdAt,
  initialQuestion,
}: {
  slug: string;
  isClosed: boolean;
  pollUserId: string | null;
  createdAt: string;
  initialQuestion: string;
}) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"close" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
