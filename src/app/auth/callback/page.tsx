"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/client";
import { Loader } from "@/components/ui/loader";

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

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [supabase, router]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-subtle)] border border-[var(--color-border)] text-[var(--color-brand-500)] shadow-md animate-bounce">
        <Loader className="h-6 w-6" />
      </div>
      <h1 className="font-serif text-2xl font-normal">Authenticating with Google...</h1>
      <p className="text-sm text-[var(--color-muted-fg)]">
        Setting up your secure SwiftPoll session. Just a moment.
      </p>
    </div>
  );
}
