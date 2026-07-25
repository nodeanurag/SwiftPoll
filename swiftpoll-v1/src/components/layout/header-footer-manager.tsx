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

  // Notification states
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(2);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const mockNotifications = [
    {
      id: "1",
      icon: "📊",
      title: "New vote received!",
      text: "Your poll 'Favorite Programming Language' just received a new vote.",
      time: "Just now"
    },
    {
      id: "2",
      icon: "👥",
      title: "Workspace Member Joined",
      text: "A new collaborator has joined your team workspace.",
      time: "2 hours ago"
    }
  ];

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
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    window.location.replace("/");
  };

  const isAppRoute = 
    pathname.startsWith("/dashboard") || 
    pathname.startsWith("/polls") || 
    pathname.startsWith("/analytics") || 
    pathname.startsWith("/workspaces") || 
    pathname.startsWith("/developer") || 
    pathname.startsWith("/profile") || 
    pathname.startsWith("/settings") || 
    pathname.startsWith("/billing") ||
    (pathname === "/templates" && user !== null);

  if (isAppRoute) {
    return (
      <div className="flex min-h-screen flex-col bg-bg text-fg select-none">
        {/* App Header */}
        <header className="sticky top-0 z-50 w-full border-b border-border bg-bg/95 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 sm:px-8">
            
            {/* Left Brand */}
            <Link href="/dashboard" className="flex items-center gap-2.5 transition-transform active:scale-95">
              <Image
                src="/logo.svg"
                alt="SwiftPoll Logo"
                width={36}
                height={36}
                className="rounded-lg object-contain"
              />
              <span className="font-serif text-lg font-normal tracking-tight text-white">
                SwiftPoll
              </span>
            </Link>

            <div className="flex items-center gap-3.5">
              {/* Controls will go here */}
            </div>
          </div>
        </header>

        {/* Dashboard main layout wrapper */}
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
    </>
  );
}
