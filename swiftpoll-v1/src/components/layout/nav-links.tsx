"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

export function NavLinks() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const supabase = getBrowserClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const builderPath = isLoggedIn ? "/dashboard#builder" : "/#builder";

  return (
    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--color-ash)]">
      <Link 
        href={builderPath} 
        className={cn(
          "hover:text-[var(--color-fg)] transition-colors",
          pathname === "/" && "text-[var(--color-fg)]"
        )}
      >
        Poll Builder
      </Link>
      {isLoggedIn && (
        <Link 
          href="/dashboard" 
          className={cn(
            "hover:text-[var(--color-fg)] transition-colors",
            pathname === "/dashboard" && "text-[var(--color-fg)]"
          )}
        >
          Dashboard
        </Link>
      )}
      <Link 
        href="/features" 
        className={cn(
          "hover:text-[var(--color-fg)] transition-colors",
          pathname === "/features" && "text-[var(--color-fg)]"
        )}
      >
        Features
      </Link>
      <Link 
        href="/templates" 
        className={cn(
          "hover:text-[var(--color-fg)] transition-colors",
          pathname === "/templates" && "text-[var(--color-fg)]"
        )}
      >
        Templates
      </Link>
      <Link 
        href="/pricing" 
        className={cn(
          "hover:text-[var(--color-fg)] transition-colors",
          pathname === "/pricing" && "text-[var(--color-fg)]"
        )}
      >
        Pricing
      </Link>
    </nav>
  );
}
