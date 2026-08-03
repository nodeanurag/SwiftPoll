"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";

let browserClient: SupabaseClient<Database> | null = null;

/**
 * Browser Supabase client using the public anon key. Used only for reads and
 * Realtime subscriptions (RLS allows public SELECT; there are no anon write
 * policies). Memoized so we keep a single Realtime connection.
 */
export function getBrowserClient(): SupabaseClient<Database> {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  browserClient = createClient<Database>(url, anonKey, {
    auth: { persistSession: true, detectSessionInUrl: true },
  });
  return browserClient;
}
