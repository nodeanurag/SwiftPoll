"use client";

import { useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { LogOut, User as UserIcon } from "lucide-react";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getBrowserClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const redirectTo = typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined;

      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });
    } catch (err) {
      // Log errors if Google OAuth initialization fails
      console.error("Google login failed:", err);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      window.location.replace("/");
    } catch (err) {
      // Log errors if Supabase sign out fails
      console.error("Logout failed:", err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-10 w-28 animate-pulse rounded-[var(--radius)] bg-[var(--color-mist)]" />
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs font-medium text-[var(--color-ash)]">
          <UserIcon className="h-3.5 w-3.5" />
          <span className="max-w-[120px] truncate">{user.email}</span>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex h-11 items-center justify-center rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-medium text-[var(--color-ash)] transition-all hover:bg-[var(--color-subtle)] hover:text-[var(--color-fg)] active:scale-95"
          aria-label="Sign out"
        >
          <LogOut className="mr-1.5 h-4 w-4" />
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleGoogleLogin}
      className="inline-flex h-11 items-center justify-center gap-2.5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] px-5 text-sm font-medium text-[var(--color-fg)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-brand-500)] hover:bg-[var(--color-subtle)] hover:shadow-md active:translate-y-0 active:scale-[0.98] cursor-pointer"
    >
      <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
      </svg>
      Sign in with Google
    </button>
  );
}
