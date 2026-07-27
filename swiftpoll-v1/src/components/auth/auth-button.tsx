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
      </div>
    );
  }

  return null;
}
