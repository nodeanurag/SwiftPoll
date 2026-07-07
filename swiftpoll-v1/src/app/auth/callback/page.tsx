"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = getBrowserClient();

  useEffect(() => {
    // Listen for auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || session) {
        router.push("/dashboard");
      }
    });

    // Fallback: if nothing happens, redirect home after 5s
    const timeout = setTimeout(() => {
      router.push("/dashboard");
    }, 5000);
  }, [supabase, router]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 px-6 text-center">
    </div>
  );
}
