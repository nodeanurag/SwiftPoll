"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { getAdminToken } from "@/lib/utils/fingerprint";
import { 
  getPollAnalytics, 
  PollAnalyticsResult, 
  AnalyticsOption 
} from "@/lib/actions/analytics";
import { ShieldAlert, Loader as LoaderIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalyticsHeader } from "./components/analytics-header";
import { AnalyticsMetrics } from "./components/analytics-metrics";
import { AnalyticsAiSummary } from "./components/analytics-ai-summary";
import { AnalyticsCharts } from "./components/analytics-charts";
import { AnalyticsTimeline } from "./components/analytics-timeline";
import { AnalyticsIntegrations } from "./components/analytics-integrations";
import { AnalyticsActivityLog } from "./components/analytics-activity-log";
import { AnalyticsDiscussion } from "./components/analytics-discussion";

export default function AnalyticsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PollAnalyticsResult | null>(null);

  // Presence and Collaboration States
  const [activeViewers, setActiveViewers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  // Load current user and enforce login
  useEffect(() => {
    const supabase = getBrowserClient();
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        if (!session?.user) {
          router.replace("/");
        } else {
          setCurrentUser({ id: session.user.id });
          setAuthLoading(false);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (isMounted) {
          if (!session?.user) {
            router.replace("/");
          } else {
            setCurrentUser({ id: session.user.id });
            setAuthLoading(false);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const viewerName = (u: User) => {
    return u.user_metadata?.full_name || u.email?.split("@")[0] || "Owner/Admin";
  };

  // Presence Subscription Effect
  useEffect(() => {
    if (!data?.poll?.id) return;
    const supabase = getBrowserClient();
    
    const channel = supabase.channel(`presence-${slug}`, {
      config: {
        presence: {
          key: slug,
        }
      }
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const viewers: { id: string; name: string; email: string }[] = [];
        Object.values(state).forEach((presences) => {
          (presences as unknown[]).forEach((p) => {
            const presence = p as { id?: string; name?: string; email?: string };
            if (presence.id) {
              viewers.push({
                id: presence.id,
                name: presence.name || "Anonymous",
                email: presence.email || "",
              });
            }
          });
        });
        const uniqueViewers = Array.from(new Map(viewers.map(v => [v.id, v])).values());
        setActiveViewers(uniqueViewers);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await channel.track({
              id: user.id,
              name: viewerName(user),
              email: user.email || "",
            });
          } else {
            await channel.track({
              id: "guest-" + Math.random().toString(36).substring(7),
              name: "Guest viewer",
              email: "",
            });
          }
        }
      });

    return () => {
      void channel.unsubscribe();
    };
  }, [data?.poll?.id, slug]);

  useEffect(() => {
    if (authLoading || !currentUser) return;

    async function loadAnalytics() {
      try {
        const supabase = getBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        const sessionToken = session?.access_token;
        const adminToken = getAdminToken(slug) || undefined;

        const res = await getPollAnalytics(slug, adminToken, sessionToken);
        if (!res.ok) {
          setError(res.error ?? "You do not have permission to view this poll's analytics.");
        } else {
          setData(res);
        }
      } catch {
        setError("Could not load analytics. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      void loadAnalytics();
    }
  }, [slug, authLoading, currentUser]);

  // Calculate insights
  const { totalVotes, votesPerOption, peakHour, winnerOption, sortedOptions, views, completionRate, avgResponseSpeed, timelineData } = useMemo(() => {
    if (!data?.votes || !data?.options || !data?.poll) {
      return { 
        totalVotes: 0, 
        votesPerOption: {} as Record<string, number>, 
        peakHour: "N/A", 
        winnerOption: null as AnalyticsOption | null, 
        sortedOptions: [] as AnalyticsOption[], 
        views: 0, 
        completionRate: 0, 
        avgResponseSpeed: "N/A",
        timelineData: [] as { label: string; count: number }[]
      };
    }

    const total = data.votes.length;
    const counts: Record<string, number> = {};
    data.options.forEach(o => { counts[o.id] = 0; });
    data.votes.forEach(v => {
      counts[v.option_id] = (counts[v.option_id] ?? 0) + 1;
    });

    // Peak Hour of Day (0-23)
    const hours: Record<number, number> = {};
    data.votes.forEach(v => {
      const date = new Date(v.created_at);
      const hr = date.getHours();
      hours[hr] = (hours[hr] ?? 0) + 1;
    });

    let maxHr = -1;
    let maxHrVotes = 0;
    Object.entries(hours).forEach(([hrStr, val]) => {
      if (val > maxHrVotes) {
        maxHrVotes = val;
        maxHr = parseInt(hrStr, 10);
      }
    });

    let peakHourLabel = "N/A";
    if (maxHr !== -1) {
      const ampm = maxHr >= 12 ? "PM" : "AM";
      const displayHr = maxHr % 12 || 12;
      peakHourLabel = `${displayHr}:00 ${ampm}`;
    }

    const sortedOpts = [...data.options].sort((a, b) => a.position - b.position);

    // Winner Calculation
    let bestOption: AnalyticsOption | null = null;
    let bestVotes = -1;
    data.options.forEach(o => {
      const c = counts[o.id] ?? 0;
      if (c > bestVotes) {
        bestVotes = c;
        bestOption = o;
      }
    });

    // Completion Rate Calculations
    const pollViews = data.poll.views ?? 0;
    const uniqueVoters = new Set<string>();
    data.votes.forEach((v) => {
      if (v.voter_id) {
        uniqueVoters.add(v.voter_id);
      }
    });
    const uniqueVotersCount = uniqueVoters.size || total;
    const compRate = pollViews > 0 ? Math.min((uniqueVotersCount / pollViews) * 100, 100) : 0;

    // Response Speed Calculation
    const durationVotes = data.votes.filter(v => v.vote_duration_ms);
    const avgDurationMs = durationVotes.length 
      ? durationVotes.reduce((sum, v) => sum + (v.vote_duration_ms ?? 0), 0) / durationVotes.length 
      : 0;
    const responseSpeedLabel = avgDurationMs > 0 ? `${(avgDurationMs / 1000).toFixed(1)}s` : "N/A";

    // Timeline Data
    const now = Date.now();
    const pollCreatedTime = new Date(data.poll.created_at).getTime();
    const ageHrs = (now - pollCreatedTime) / (3600 * 1000);
    const isHourly = ageHrs <= 48;

    const intervalsCount = isHourly ? 24 : 7;
    const intervalMs = isHourly ? 3600 * 1000 : 24 * 3600 * 1000;
    
    const timeline = [];
    for (let i = intervalsCount - 1; i >= 0; i--) {
      const startTime = now - i * intervalMs;
      const endTime = startTime + intervalMs;
      
      const label = isHourly 
        ? new Date(startTime).toLocaleTimeString([], { hour: 'numeric' })
        : new Date(startTime).toLocaleDateString([], { month: 'short', day: 'numeric' });
         
      const count = data.votes.filter(v => {
        const vt = new Date(v.created_at).getTime();
        return vt >= startTime && vt < endTime;
      }).length;
      
      timeline.push({ label, count });
    }

    return {
      totalVotes: total,
      votesPerOption: counts,
      peakHour: peakHourLabel,
      winnerOption: total > 0 ? bestOption : null,
      sortedOptions: sortedOpts,
      views: pollViews,
      completionRate: Number(compRate.toFixed(1)),
      avgResponseSpeed: responseSpeedLabel,
      timelineData: timeline
    };
  }, [data]);

  // Raw file downloads
  const handleExportCSV = () => {
    if (!data?.votes || !data?.options) return;

    const optMap: Record<string, string> = {};
    data.options.forEach(o => { optMap[o.id] = o.text; });

    const csvHeaders = ["Vote ID", "Choice", "Created At", "Voter Token/ID"].join(",");
    const csvRows = data.votes.map(v => 
      [v.id, `"${(optMap[v.option_id] || "").replace(/"/g, '""')}"`, v.created_at, v.voter_id || "Anonymous"].join(",")
    );
    const csvContent = [csvHeaders, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `poll_${slug}_analytics.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (!data) return;

    const exportData = {
      poll: data.poll,
      options: data.options,
      votes: data.votes
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `poll_${slug}_analytics.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return (
      <main className="mx-auto min-h-screen max-w-4xl px-4 py-12 flex flex-col items-center justify-center space-y-4">
        <LoaderIcon className="h-10 w-10 animate-spin text-[var(--color-brand-600)]" />
        <p className="text-sm text-[var(--color-muted-fg)] font-serif italic">Verifying session...</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto min-h-screen max-w-4xl px-4 py-12 flex flex-col items-center justify-center space-y-4">
        <LoaderIcon className="h-10 w-10 animate-spin text-[var(--color-brand-600)]" />
        <p className="text-sm text-[var(--color-muted-fg)] font-serif italic">Analyzing poll responses...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto min-h-screen max-w-xl px-4 py-20 flex flex-col items-center justify-center text-center space-y-5">
        <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center text-red-500">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-normal tracking-tight">Access Denied</h2>
          <p className="text-sm text-[var(--color-muted-fg)] max-w-md mx-auto leading-relaxed">
            {error || "We could not authenticate your ownership of this poll."}
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="secondary" className="flex items-center gap-2 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8 space-y-8 animate-fade-in text-fg bg-background">
      {/* Header component */}
      <AnalyticsHeader 
        question={data.poll?.question}
        activeViewers={activeViewers}
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
      />

      {/* Tally Metrics Grid */}
      <AnalyticsMetrics 
        totalVotes={totalVotes}
        views={views}
        completionRate={completionRate}
        winnerOption={winnerOption}
        votesPerOption={votesPerOption}
        peakHour={peakHour}
        avgResponseSpeed={avgResponseSpeed}
      />

      {/* AI Insights Card */}
      <AnalyticsAiSummary 
        slug={slug}
        totalVotes={totalVotes}
        views={views}
        completionRate={completionRate}
        avgResponseSpeed={avgResponseSpeed}
        winnerOption={winnerOption}
        votesPerOption={votesPerOption}
        rawVotes={data.votes}
      />

      {/* Visual Chart block */}
      <AnalyticsCharts 
        totalVotes={totalVotes}
        sortedOptions={sortedOptions}
        votesPerOption={votesPerOption}
      />

      {/* Activity Timeline Chart */}
      <AnalyticsTimeline 
        totalVotes={totalVotes}
        timelineData={timelineData}
      />

      {/* Integrations & Webhooks Hub */}
      <AnalyticsIntegrations 
        poll={data.poll}
        slug={slug}
      />

      {/* Raw Vote Log table */}
      <AnalyticsActivityLog 
        totalVotes={totalVotes}
        votes={data.votes}
        options={data.options || []}
      />

      {/* Collaborative Workspace Discussion Board */}
      {data.poll?.workspace_id && (
        <AnalyticsDiscussion 
          pollId={data.poll.id}
          workspaceId={data.poll.workspace_id}
          slug={slug}
          currentUser={currentUser}
        />
      )}
    </main>
  );
}
