"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { getWorkspaces, Workspace } from "@/lib/actions/workspace";

export interface PollListItem {
  id: string;
  slug: string;
  question: string;
  closed: boolean;
  closes_at: string | null;
  created_at: string;
  user_id: string | null;
  require_auth: boolean;
  votes: { count: number }[];
  poll_options?: { id: string; text: string; position: number }[];
}

interface DashboardContextType {
  user: User | null;
  authLoading: boolean;
  sessionToken: string | undefined;
  workspaces: Workspace[];
  setWorkspaces: React.Dispatch<React.SetStateAction<Workspace[]>>;
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (ws: Workspace | null) => void;
  polls: PollListItem[];
  setPolls: React.Dispatch<React.SetStateAction<PollListItem[]>>;
  loadingPolls: boolean;
  refreshPolls: () => Promise<void>;
  currentTime: number;
  error: string | null;
  setError: (err: string | null) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const supabase = getBrowserClient();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | undefined>(undefined);
  const [polls, setPolls] = useState<PollListItem[]>([]);
  const [loadingPolls, setLoadingPolls] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Set active workspace preference
  const setActiveWorkspace = useCallback((ws: Workspace | null) => {
    setActiveWorkspaceState(ws);
    if (typeof window !== "undefined") {
      if (ws) {
        localStorage.setItem("swiftpoll_active_workspace_id", ws.id);
      } else {
        localStorage.removeItem("swiftpoll_active_workspace_id");
      }
    }
  }, []);

  // Time state to prevent hydration mismatches
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentTime(Date.now());
  }, []);

  // Sync auth state
  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (!session?.user) {
        setUser(null);
        setSessionToken(undefined);
        setAuthLoading(false);
      } else {
        setUser(session.user);
        setSessionToken(session.access_token);
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        if (!session?.user) {
          setUser(null);
          setSessionToken(undefined);
          setAuthLoading(false);
          router.replace("/");
        } else {
          setUser(session.user);
          setSessionToken(session.access_token);
          setAuthLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  // Load workspaces when authenticated
  useEffect(() => {
    async function loadWorkspaces() {
      if (!sessionToken) {
        setWorkspaces([]);
        setActiveWorkspace(null);
        return;
      }
      const res = await getWorkspaces(sessionToken);
      if (res.ok && res.data) {
        setWorkspaces(res.data);
        // Attempt to restore active workspace preference
        const storedId = localStorage.getItem("swiftpoll_active_workspace_id");
        if (storedId) {
          const match = res.data.find((w) => w.id === storedId);
          if (match) {
            setActiveWorkspaceState(match);
          }
        }
      }
    }
    void loadWorkspaces();
  }, [sessionToken, setActiveWorkspace]);

  // Fetch polls function
  const fetchPolls = useCallback(async () => {
    if (authLoading) return;
    setLoadingPolls(true);
    setError(null);

    try {
      let query = supabase
        .from("polls")
        .select("id, slug, question, closed, closes_at, created_at, user_id, require_auth, votes:votes(count), poll_options(id, text, position)");

      if (user) {
        if (activeWorkspace) {
          query = query.eq("workspace_id", activeWorkspace.id);
        } else {
          query = query.eq("user_id", user.id).is("workspace_id", null);
        }
      } else {
        // Free guest / anonymous users
        if (typeof window === "undefined") {
          setPolls([]);
          setLoadingPolls(false);
          return;
        }
        const stored = localStorage.getItem("swiftpoll_created_polls_slugs");
        const slugs: string[] = stored ? JSON.parse(stored) : [];
        if (!slugs || slugs.length === 0) {
          setPolls([]);
          setLoadingPolls(false);
          return;
        }
        query = query.in("slug", slugs);
      }

      const { data, error: fetchError } = await query.order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      if (data) {
        setPolls(data as unknown as PollListItem[]);
      }
    } catch (err) {
      console.error("Error fetching polls:", err);
      setError("Failed to load polls. Please refresh and try again.");
    } finally {
      setLoadingPolls(false);
    }
  }, [supabase, user, activeWorkspace, authLoading]);

  // Trigger poll load when workspace context changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPolls();
  }, [fetchPolls]);

  return (
    <DashboardContext.Provider
      value={{
        user,
        authLoading,
        sessionToken,
        workspaces,
        setWorkspaces,
        activeWorkspace,
        setActiveWorkspace,
        polls,
        setPolls,
        loadingPolls,
        refreshPolls: fetchPolls,
        currentTime,
        error,
        setError,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
