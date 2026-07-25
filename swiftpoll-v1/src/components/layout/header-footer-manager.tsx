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

            {/* Middle Nav Links */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-muted-fg">
              <Link 
                href="/dashboard" 
                className={cn("hover:text-fg transition-colors", pathname === "/dashboard" && "text-fg")}
              >
                Dashboard
              </Link>
              <Link 
                href="/polls" 
                className={cn("hover:text-fg transition-colors", pathname.startsWith("/polls") && !pathname.includes("/create") && "text-fg")}
              >
                My Polls
              </Link>
              <Link 
                href="/analytics" 
                className={cn("hover:text-fg transition-colors", pathname === "/analytics" && "text-fg")}
              >
                Analytics
              </Link>
              <Link 
                href="/templates" 
                className={cn("hover:text-fg transition-colors", pathname === "/templates" && "text-fg")}
              >
                Templates
              </Link>
              <a 
                href="https://github.com/nodeanurag/SwiftPoll" 
                target="_blank"
                rel="noreferrer"
                className="hover:text-fg transition-colors flex items-center gap-1"
              >
                Docs <ExternalLinkIcon className="h-3 w-3" />
              </a>
            </nav>

            {/* Right Side Controls */}
            <div className="flex items-center gap-3.5">
              
              {/* Interactive Search trigger */}
              <button
                onClick={() => setSearchOpen(true)}
                type="button"
                className="relative hidden lg:flex items-center w-40 cursor-pointer text-left focus:outline-none"
              >
                <Search className="absolute left-2.5 h-3 w-3 text-muted-fg" />
                <div className="h-8 pl-7.5 pr-8 w-full bg-subtle/30 border border-border text-[11px] rounded-xl flex items-center text-muted-fg hover:bg-subtle/50 transition-colors">
                  Search...
                </div>
                <span className="absolute right-2.5 text-[8px] bg-subtle border border-border px-1 rounded font-mono text-muted-fg leading-none py-0.5">
                  ⌘K
                </span>
              </button>

              {/* Notification icon & popover */}
              <div className="relative" ref={notificationsRef}>
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  type="button"
                  className="p-2 text-muted-fg hover:text-fg hover:bg-subtle rounded-xl transition-all relative cursor-pointer"
                >
                  <Bell className="h-4 w-4" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-brand-500 rounded-full" />
                  )}
                </button>

                {/* Notifications Panel */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-card p-3 shadow-2xl animate-scale-up text-left z-50">
                    <div className="flex justify-between items-center pb-2 mb-2 border-b border-border/50">
                      <h4 className="text-xs font-bold text-fg">Notifications</h4>
                      {unreadNotifications > 0 && (
                        <button 
                          onClick={() => setUnreadNotifications(0)}
                          className="text-[10px] text-brand-500 hover:underline cursor-pointer border-0 bg-transparent p-0"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {mockNotifications.map((n) => (
                        <div key={n.id} className="p-2.5 rounded-xl bg-subtle/20 border border-border/50 space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-fg">
                            <span>{n.icon}</span>
                            <span>{n.title}</span>
                            <span className="ml-auto text-[8px] text-muted-fg font-normal">{n.time}</span>
                          </div>
                          <p className="text-[10px] text-muted-fg leading-normal">{n.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* + Create Poll CTA */}
              <Link href="/polls/create">
                <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-bg text-xs font-bold h-8 px-3.5 flex gap-1.5 items-center cursor-pointer border-0 rounded-xl shadow-sm">
                  <Plus className="h-3.5 w-3.5" />
                  Create Poll
                </Button>
              </Link>

              {/* User dropdown trigger */}
              {loading ? (
                <div className="h-8 w-8 rounded-full bg-subtle animate-pulse" />
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1.5 p-0.5 rounded-full hover:bg-subtle/50 transition-all cursor-pointer"
                  >
                    <span className="h-8 w-8 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 font-bold text-xs flex items-center justify-center">
                      {user?.email?.[0].toUpperCase() || "N"}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-fg" />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-card p-2 shadow-2xl animate-scale-up text-left z-50">
                      <div className="px-3 py-2 border-b border-border/50 mb-1">
                        <p className="text-xs font-semibold text-fg truncate">
                          {user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
                        </p>
                        <p className="text-[10px] text-muted-fg truncate mt-0.5">
                          {user?.email || "guest@swiftpoll.co"}
                        </p>
                      </div>
                      
                      <Link 
                        href="/profile" 
                        onClick={() => setDropdownOpen(false)}
                        className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-fg hover:text-fg hover:bg-subtle transition-all"
                      >
                        <UserIcon className="h-3.5 w-3.5" />
                        Profile Settings
                      </Link>

                      <Link 
                        href="/settings" 
                        onClick={() => setDropdownOpen(false)}
                        className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-fg hover:text-fg hover:bg-subtle transition-all"
                      >
                        <SettingsIcon className="h-3.5 w-3.5" />
                        Preferences
                      </Link>

                      <Link 
                        href="/billing" 
                        onClick={() => setDropdownOpen(false)}
                        className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-fg hover:text-fg hover:bg-subtle transition-all"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        Billing Details
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-500 hover:bg-red-500/10 transition-all border-t border-border/50 mt-1 pt-2.5 cursor-pointer text-left"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}
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

function ExternalLinkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}
