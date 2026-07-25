"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { 
  Search, 
  Bell, 
  Plus, 
  LogOut, 
  User as UserIcon, 
  CreditCard, 
  Settings as SettingsIcon,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/auth/auth-button";
import { NavLinks } from "@/components/layout/nav-links";
import { ThemeToggle } from "../theme-toggle";

export function HeaderFooterManager({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const supabase = getBrowserClient();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search dialog states
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [polls, setPolls] = useState<{ id: string; question: string; slug: string; created_at: string; }[]>([]);

  // Sync auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

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

  // Fetch user polls for search
  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPolls([]);
      return;
    }
    async function fetchUserPolls() {
      if (!user) return;
      const { data } = await supabase
        .from("polls")
        .select("id, question, slug, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setPolls(data);
    }
    void fetchUserPolls();
  }, [user, supabase]);

  // Keydown listener for ⌘K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      {children}
    </>
  );
}
