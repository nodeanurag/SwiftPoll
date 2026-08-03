import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";

let serverClient: SupabaseClient<Database> | null = null;

/**
 * Server-only Supabase client using the service-role key. Bypasses RLS, so it
 * is the single path for all writes (and for reading poll_secrets). MUST never
 * be imported into client components — `server-only` enforces this at build.
 */
export function getServerClient(): SupabaseClient<Database> {
  if (serverClient) return serverClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  serverClient = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serverClient;
}
