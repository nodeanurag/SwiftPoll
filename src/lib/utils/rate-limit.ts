import { createHash } from "node:crypto";
import { getServerClient } from "@/lib/supabase/server";

/**
 * Database-backed IP rate limiter. Tracks how many times an IP has voted on a given
 * poll by querying the public.rate_limits table.
 */
const MAX_VOTES_PER_IP_PER_POLL = 5;

/** Hash an IP with an optional salt so raw addresses are never stored. */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT ?? "";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/**
 * Check if the ipHash has remaining votes for pollId in the public.rate_limits table.
 */
export async function checkRateLimit(
  pollId: string,
  ipHash: string | null,
  max: number = MAX_VOTES_PER_IP_PER_POLL,
): Promise<RateLimitResult> {
  if (!ipHash) return { allowed: true, remaining: max };

  const supabase = getServerClient();
  const action = `vote:${pollId}`;

  const { count, error } = await supabase
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .eq("action", action);

  if (error) {
    console.error("Rate limit query error:", error);
    // On query failure, fail closed to prevent spam bypass
    return { allowed: false, remaining: 0 };
  }

  const used = count ?? 0;
  if (used >= max) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: max - used };
}

/** Test helper — clears mock states. */
export function __resetRateLimits(): void {
  // No-op for db-backed rate limiter
}

export { MAX_VOTES_PER_IP_PER_POLL };
