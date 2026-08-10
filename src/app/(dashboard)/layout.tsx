"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardProvider, useDashboard } from "@/context/dashboard-context";
import {
  Home,
  ListTodo,
  PlusCircle,
  LayoutTemplate,
  Trash2,
  BarChart3,
  Folder,
  Users,
  Key,
  ExternalLink,
  Laptop,
  User as UserIcon,
  CreditCard,
  Settings as SettingsIcon,
  ChevronDown,
  Zap,
  Loader
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

type SectionKey = "overview" | "polls" | "analytics" | "workspace" | "developer" | "account";

interface SidebarSection {
  key: SectionKey;
  label: string;
  items: {
    label: string;
    href: string;
    icon: React.ReactNode;
  }[];
}

const sections: SidebarSection[] = [
  {
    key: "overview",
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: <Home className="h-4 w-4" /> }
    ]
  },
  {
    key: "polls",
    label: "Polls",
    items: [
      { label: "My Polls", href: "/polls", icon: <ListTodo className="h-4 w-4" /> },
      { label: "Create Poll", href: "/polls/create", icon: <PlusCircle className="h-4 w-4" /> },
      { label: "Templates", href: "/templates", icon: <LayoutTemplate className="h-4 w-4" /> },
      { label: "Trash", href: "/polls?filter=closed", icon: <Trash2 className="h-4 w-4" /> }
    ]
  },
  {
    key: "analytics",
    label: "Analytics",
    items: [
      { label: "Analytics", href: "/analytics", icon: <BarChart3 className="h-4 w-4" /> }
    ]
  },
  {
    key: "workspace",
    label: "Workspace",
    items: [
      { label: "Workspaces", href: "/workspaces", icon: <Folder className="h-4 w-4" /> },
      { label: "Team Members", href: "/workspaces?tab=members", icon: <Users className="h-4 w-4" /> }
    ]
  },
  {
    key: "developer",
    label: "Developer",
    items: [
      { label: "API Keys", href: "/developer", icon: <Key className="h-4 w-4" /> },
      { label: "Webhooks", href: "/developer?tab=webhooks", icon: <ExternalLink className="h-4 w-4" /> },
      { label: "Integrations", href: "/developer?tab=integrations", icon: <Laptop className="h-4 w-4" /> }
    ]
  },
  {
    key: "account",
    label: "Account",
    items: [
      { label: "Profile", href: "/profile", icon: <UserIcon className="h-4 w-4" /> },
      { label: "Billing", href: "/billing", icon: <CreditCard className="h-4 w-4" /> },
      { label: "Settings", href: "/settings", icon: <SettingsIcon className="h-4 w-4" /> }
    ]
  }
];

function SidebarNav() {
  const pathname = usePathname();
  const { user, authLoading } = useDashboard();
  const [expandedSection, setExpandedSection] = useState<SectionKey>("overview");

  // Auto-expand section matching current route on load
  useEffect(() => {
    const matched = sections.find(s =>
      s.items.some(item => {
        const itemUrl = new URL(item.href, "http://localhost");
        return pathname === itemUrl.pathname;
      })
    );
    if (matched) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedSection(matched.key);
    }
  }, [pathname]);

  const toggleSection = (key: SectionKey) => {
    setExpandedSection(prev => prev === key ? key : key); // Accordion: only one expanded, always keep open the clicked one
  };

  if (authLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center py-12">
        <Loader className="h-6 w-6 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-3">
        {sections.map((section) => {
          const isExpanded = expandedSection === section.key;
          return (
            <div key={section.key} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleSection(section.key)}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left text-[10px] font-bold uppercase tracking-[0.08em] text-muted-fg/90 hover:text-fg transition-all cursor-pointer mt-1"
              >
                <span>{section.label}</span>
                <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", isExpanded && "transform rotate-180")} />
              </button>

              <div
                className={cn(
                  "space-y-0.5 pl-2 overflow-hidden transition-all duration-300 max-h-0",
                  isExpanded && "max-h-[300px]"
                )}
              >
                {section.items.map((item) => {
                  const itemUrl = new URL(item.href, "http://localhost");
                  const isActive = pathname === itemUrl.pathname &&
                    (itemUrl.searchParams.get("filter") ? pathname + window.location.search === item.href : true);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold transition-all duration-150",
                        isActive
                          ? "text-brand-500 bg-brand-500/10 border-l-2 border-brand-500 rounded-r-xl rounded-l-none pl-2.5"
                          : "text-muted-fg hover:text-fg hover:translate-x-1"
                      )}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-4 pt-6 border-t border-border/50">
        {/* Upgrade Pro Prompt */}
        {user && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 to-purple-950/40 border border-blue-500/20 space-y-3">
            <div className="flex items-center gap-2 text-blue-400">
              <Zap className="h-4 w-4 fill-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Go Pro</span>
            </div>
            <p className="text-[10px] text-muted-fg leading-relaxed font-medium">
              Unlock more polls, advanced analytics and custom branding.
            </p>
            <Link href="/billing" className="block">
              <Button size="sm" className="w-full text-[10px] h-8 bg-blue-600 text-white hover:bg-blue-500 border-0 cursor-pointer shadow-sm">
                Upgrade Now
              </Button>
            </Link>
          </div>
        )}

        {/* Status Indicator */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-subtle border border-border/30 text-[10px] font-semibold">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-brand-500 text-bg flex items-center justify-center text-xs font-bold">
              {user?.email?.[0].toUpperCase() || "N"}
            </span>
            <span className="text-fg truncate max-w-[100px]">
              {user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Guest"}
            </span>
          </div>
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[8px] font-bold text-emerald-400 border border-emerald-500/20">
            Active
          </span>
        </div>
      </div>
    </div>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useDashboard();

  if (authLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center py-12 bg-bg">
        <Loader className="h-6 w-6 text-brand-500 animate-spin" />
      </div>
    );
  }

  const showSidebar = user !== null;

  return (
    <div className="bg-bg text-fg h-[calc(100vh-4rem)] w-full flex dashboard-layout overflow-hidden">
      {/* Sidebar Navigation */}
      {showSidebar && (
        <aside className="hidden lg:flex w-64 shrink-0 border-r border-border bg-pure-white/5 flex-col p-6 overflow-y-auto">
          <SidebarNav />
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col overflow-y-auto bg-bg">
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardProvider>
  );
}
