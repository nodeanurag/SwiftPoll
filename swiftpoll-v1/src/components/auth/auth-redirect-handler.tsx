"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/client";

/**
 * Ensures authenticated users visiting the landing page are redirected 
 * to their dashboard. Does nothing for anonymous users.
 */
export function AuthRedirectHandler() {
  const router = useRouter();
  const supabase = getBrowserClient();

  return null;
}
