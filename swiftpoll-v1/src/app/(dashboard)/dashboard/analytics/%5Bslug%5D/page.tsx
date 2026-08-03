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
import { 
  getPollComments, 
  postPollComment, 
  deletePollComment, 
  PollComment 
} from "@/lib/actions/comments";
import { testWebhookAction } from "@/lib/actions/integrations";
import { 
  ArrowLeft, 
  Download, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Clock, 
  Award, 
  ShieldAlert,
  Loader as LoaderIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export default function AnalyticsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PollAnalyticsResult | null>(null);
  const [chartType, setChartType] = useState<"bar" | "donut">("bar");

  // AI Summary States
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<{
    winnerSummary?: string;
    trendsSummary?: string;
    commentsClustering?: string[];
  } | null>(null);
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null);

  // Presence and Collaboration States
  const [activeViewers, setActiveViewers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [comments, setComments] = useState<PollComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  // Integration States
  const [testWebhookLoading, setTestWebhookLoading] = useState(false);
  const [testWebhookResult, setTestWebhookResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [activeIntegrationTab, setActiveIntegrationTab] = useState<"sheets" | "webhooks" | "payload">("sheets");

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

  // Comments Load & Realtime Subscription Effect
  useEffect(() => {
    if (!data?.poll?.id || !data.poll.workspace_id) return;
    
    async function loadComments() {
      const res = await getPollComments(data!.poll!.id);
      if (res.ok && res.data) {
        setComments(res.data);
      }
    }
    
    void loadComments();

    const supabase = getBrowserClient();
    const commentsChannel = supabase
      .channel(`poll-comments-${data.poll.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "poll_comments",
          filter: `poll_id=eq.${data.poll.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newComment = payload.new as PollComment;
            setComments((prev) => {
              if (prev.some((c) => c.id === newComment.id)) return prev;
              return [...prev, newComment];
            });
          } else if (payload.eventType === "DELETE") {
            const oldCommentId = (payload.old as { id: string }).id;
            setComments((prev) => prev.filter((c) => c.id !== oldCommentId));
          }
        }
      )
      .subscribe();

    return () => {
      void commentsChannel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.poll?.id, data?.poll?.workspace_id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !data?.poll?.id) return;
    
    try {
      const supabase = getBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await postPollComment(data.poll.id, commentText, token);
      if (res.ok && res.data) {
        setCommentText("");
      }
    } catch (err) {
      console.error("Could not post comment:", err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const supabase = getBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await deletePollComment(commentId, token);
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch (err) {
      console.error("Could not delete comment:", err);
    }
  };

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

  // 1. Calculate insights
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

    // Sort options sequentially to match options layout
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

    // Timeline Data (Hourly for last 24h or Daily for last 7d)
    // eslint-disable-next-line react-hooks/purity
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

  // Donut chart path layout helpers
  const donutSegments = useMemo(() => {
    if (totalVotes === 0 || !sortedOptions.length) return [];
    
    let currentAngle = 0;
    const colors = [
      "var(--color-brand-600)",
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ec4899",
      "#8b5cf6",
      "#06b6d4",
      "#84cc16",
    ];

    return sortedOptions.map((opt, i) => {
      const count = votesPerOption[opt.id] ?? 0;
      const percentage = (count / totalVotes) * 100;
      const angle = (count / totalVotes) * 360;

      // Circle layout mathematics
      const r = 50;
      const cx = 60;
      const cy = 60;
      
      const x1 = cx + r * Math.cos((currentAngle - 90) * Math.PI / 180);
      const y1 = cy + r * Math.sin((currentAngle - 90) * Math.PI / 180);
      
      currentAngle += angle;
      
      const x2 = cx + r * Math.cos((currentAngle - 90) * Math.PI / 180);
      const y2 = cy + r * Math.sin((currentAngle - 90) * Math.PI / 180);

      const largeArc = angle > 180 ? 1 : 0;
      const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      return {
        pathData,
        color: colors[i % colors.length],
        percentage: percentage.toFixed(1),
        text: opt.text,
        count
      };
    });
  }, [sortedOptions, votesPerOption, totalVotes]);

  const handleGenerateAiSummary = async () => {
    setAiSummaryLoading(true);
    setAiSummaryError(null);
    try {
      const supabase = getBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const sessionToken = session?.access_token;
      const adminToken = getAdminToken(slug) || undefined;

      const { generatePollSummaryAction } = await import("@/lib/actions/ai");
      const res = await generatePollSummaryAction(slug, adminToken, sessionToken);

      if (res.ok) {
        setAiSummary({
          winnerSummary: res.winnerSummary,
          trendsSummary: res.trendsSummary,
          commentsClustering: res.commentsClustering,
        });
      } else {
        if (res.error === "GEMINI_API_KEY_MISSING") {
          setAiSummary({
            winnerSummary: winnerOption 
              ? `"${winnerOption.text}" is currently leading with ${votesPerOption[winnerOption.id]} votes, representing ${((votesPerOption[winnerOption.id] ?? 0) / (totalVotes || 1) * 100).toFixed(0)}% of the total choices.`
              : "No winner could be determined as there are no votes cast on this poll yet.",
            trendsSummary: `A total turnout of ${totalVotes} responses was registered across ${views} page views, resulting in a completion rate of ${completionRate}%. The average response speed was ${avgResponseSpeed}.`,
            commentsClustering: data?.votes?.map(v => v.text_response).filter(Boolean).slice(0, 3) as string[] || []
          });
        } else {
          setAiSummaryError(res.error ?? "Failed to generate AI insights.");
        }
      }
    } catch {
      setAiSummaryError("Could not connect to AI service. Please try again.");
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!data?.poll?.webhook_url) return;
    setTestWebhookLoading(true);
    setTestWebhookResult(null);
    try {
      const res = await testWebhookAction(data.poll.webhook_url, data.poll.question, slug);
      setTestWebhookResult(res);
    } catch (err: unknown) {
      const error = err as Error;
      setTestWebhookResult({ ok: false, error: error.message || "Request failed." });
    } finally {
      setTestWebhookLoading(false);
    }
  };

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
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8 space-y-8 animate-fade-in">
      {/* Header section */}
      <div className="space-y-4">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] transition-all">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Creator Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-brand-600)] bg-[var(--color-brand-50)] px-2 py-0.5 rounded-full dark:bg-brand-900/20">
                Creator Console
              </span>
              
              {/* Presence Avatars */}
              {activeViewers.length > 1 && (
                <div className="flex items-center gap-1">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {activeViewers.slice(0, 3).map((viewer) => {
                      const initials = viewer.name.substring(0, 2).toUpperCase();
                      return (
                        <div
                          key={viewer.id}
                          title={`${viewer.name} (${viewer.email || 'Guest'})`}
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[8px] font-bold text-white ring-1 ring-[var(--color-card)]"
                        >
                          {initials}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[9px] text-[var(--color-muted-fg)] font-medium">
                    {activeViewers.length} viewing
                  </span>
                </div>
              )}
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal leading-tight text-balance">
              {data.poll?.question}
            </h1>
          </div>
          <div className="flex gap-2 w-full sm:w-auto shrink-0">
            <Button onClick={handleExportCSV} variant="secondary" size="sm" className="flex-1 sm:flex-none text-xs gap-1.5 cursor-pointer">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
            <Button onClick={handleExportJSON} variant="secondary" size="sm" className="flex-1 sm:flex-none text-xs gap-1.5 cursor-pointer">
              <Download className="h-3.5 w-3.5" />
              Export JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Tally Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-between space-y-3 shadow-sm">
          <div className="flex justify-between items-center text-[var(--color-muted-fg)]">
            <span className="text-xs font-medium">Turnout</span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <div className="text-2xl font-serif">{totalVotes} votes</div>
            <div className="text-[10px] text-[var(--color-muted-fg)]">
              {views} views · {completionRate}% rate
            </div>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between space-y-3 shadow-sm">
          <div className="flex justify-between items-center text-[var(--color-muted-fg)]">
            <span className="text-xs font-medium">Leading Choice</span>
            <Award className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">
              {winnerOption ? (winnerOption as AnalyticsOption).text : "No votes"}
            </div>
            <div className="text-[10px] text-[var(--color-muted-fg)]">
              {winnerOption 
                ? `${((votesPerOption[(winnerOption as AnalyticsOption).id] ?? 0) / (totalVotes || 1) * 100).toFixed(0)}% of responses` 
                : "Awaiting votes"}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between space-y-3 shadow-sm">
          <div className="flex justify-between items-center text-[var(--color-muted-fg)]">
            <span className="text-xs font-medium">Peak Hour</span>
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold truncate">{peakHour}</div>
            <div className="text-[10px] text-[var(--color-muted-fg)]">Most active hour</div>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between space-y-3 shadow-sm">
          <div className="flex justify-between items-center text-[var(--color-muted-fg)]">
            <span className="text-xs font-medium">Average Speed</span>
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <div className="text-2xl font-serif">{avgResponseSpeed}</div>
            <div className="text-[10px] text-[var(--color-muted-fg)]">
              Page-load to vote cast
            </div>
          </div>
        </Card>
      </div>

      {/* AI Insights Card */}
      <Card className="p-6 space-y-4 border border-brand-500/20 bg-brand-500/5 dark:bg-brand-900/5 shadow-sm relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />

        <div className="flex justify-between items-start flex-wrap gap-4">
          <div className="flex gap-3">
            <span className="text-xl">✨</span>
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-normal text-brand-900 dark:text-brand-100 flex items-center gap-1.5">
                AI Smart Summarizer
              </h3>
              <p className="text-xs text-[var(--color-muted-fg)] leading-relaxed max-w-xl">
                Get an automated overview explaining choice margins, voter patterns, and clustered commentary feedback.
              </p>
            </div>
          </div>
          <Button
            onClick={handleGenerateAiSummary}
            disabled={aiSummaryLoading || totalVotes === 0}
            className="text-xs gap-1.5 shrink-0 bg-[var(--color-fg)] text-[var(--color-bg)] hover:bg-[var(--color-muted-fg)] cursor-pointer font-medium"
            size="sm"
          >
            {aiSummaryLoading ? <LoaderIcon className="h-3.5 w-3.5 animate-spin" /> : "⚡"}
            {aiSummaryLoading ? "Analyzing..." : "Generate AI Insights"}
          </Button>
        </div>

        {aiSummaryError && (
          <p className="text-xs text-red-600 mt-2 font-medium">{aiSummaryError}</p>
        )}

        {aiSummary && (
          <div className="mt-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] space-y-4 text-sm leading-relaxed animate-fade-in-up">
            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-600">Choice Winner Insights</span>
                <p className="text-sm font-medium text-[var(--color-fg)]">{aiSummary.winnerSummary}</p>
              </div>
              <div className="h-px bg-[var(--color-border)] w-full" />
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-600">Turnout & Patterns</span>
                <p className="text-sm text-[var(--color-muted-fg)]">{aiSummary.trendsSummary}</p>
              </div>
              {aiSummary.commentsClustering && aiSummary.commentsClustering.length > 0 && (
                <>
                  <div className="h-px bg-[var(--color-border)] w-full" />
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-brand-600">Voter Feedback Clusters</span>
                    <ul className="list-disc pl-4 space-y-1.5 text-xs text-[var(--color-muted-fg)]">
                      {aiSummary.commentsClustering.map((cluster, i) => (
                        <li key={i}>{cluster}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Visual Chart block */}
      <Card className="p-6 space-y-6 shadow-sm">
        <div className="flex justify-between items-center flex-wrap gap-3 border-b pb-4 border-[var(--color-border)]">
          <div>
            <h3 className="font-serif text-lg font-normal">Response Share</h3>
            <p className="text-xs text-[var(--color-muted-fg)]">Percentage spread of vote outcomes</p>
          </div>
          <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-subtle)] p-0.5">
            <button
              onClick={() => setChartType("bar")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1 transition-all duration-200 cursor-pointer ${
                chartType === "bar" ? "bg-[var(--color-card)] text-[var(--color-fg)] shadow-sm border border-[var(--color-border)]" : "text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Bar View
            </button>
            <button
              onClick={() => setChartType("donut")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1 transition-all duration-200 cursor-pointer ${
                chartType === "donut" ? "bg-[var(--color-card)] text-[var(--color-fg)] shadow-sm border border-[var(--color-border)]" : "text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
              }`}
            >
              <PieChart className="h-3.5 w-3.5" />
              Donut View
            </button>
          </div>
        </div>

        {totalVotes === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-sm font-medium text-[var(--color-muted-fg)]">Awaiting responses</p>
            <p className="text-xs text-[var(--color-muted-fg)] max-w-xs mx-auto leading-relaxed">
              No votes have been cast on this poll yet. Once voters submit their choices, charts will update instantly.
            </p>
          </div>
        ) : chartType === "bar" ? (
          <div className="space-y-4 py-2">
            {sortedOptions.map((opt) => {
              const count = votesPerOption[opt.id] ?? 0;
              const percentage = (count / totalVotes) * 100;
              return (
                <div key={opt.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="truncate pr-4">{opt.text}</span>
                    <span>{count} vote{count !== 1 ? "s" : ""} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-7 w-full bg-[var(--color-subtle)] rounded-md overflow-hidden relative border border-[var(--color-border)]">
                    <div 
                      className="h-full bg-[var(--color-brand-600)] transition-all duration-700 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
            <svg viewBox="0 0 120 120" className="h-44 w-44 md:h-52 md:w-52 transform -rotate-90">
              {donutSegments.map((seg, i) => (
                <path
                  key={i}
                  d={seg.pathData}
                  fill={seg.color}
                  className="transition-transform duration-300 hover:scale-105"
                />
              ))}
            </svg>
            <div className="space-y-2.5 max-w-sm w-full">
              {donutSegments.map((seg, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0 pr-4">
                    <div className="h-3.5 w-3.5 shrink-0 rounded" style={{ backgroundColor: seg.color }} />
                    <span className="truncate font-medium">{seg.text}</span>
                  </div>
                  <span className="shrink-0 text-[var(--color-muted-fg)] font-medium">
                    {seg.count} ({seg.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Activity Timeline Chart */}
      <Card className="p-6 space-y-4 shadow-sm animate-fade-in-up">
        <div>
          <h3 className="font-serif text-lg font-normal">Voting Activity Timeline</h3>
          <p className="text-xs text-[var(--color-muted-fg)]">
            Hourly votes registered over the last 24 hours (or daily for the last 7 days)
          </p>
        </div>
        {totalVotes === 0 ? (
          <p className="py-12 text-center text-xs text-[var(--color-muted-fg)]">No voting activity recorded yet.</p>
        ) : (
          <div className="pt-4">
            {/* SVG Area Chart */}
            {(() => {
              const maxCount = Math.max(...timelineData.map(d => d.count), 1);
              const chartHeight = 140;
              const chartWidth = 720;
              const points = timelineData.map((d, index) => {
                const x = (index / (timelineData.length - 1)) * (chartWidth - 40) + 20;
                const y = chartHeight - 25 - (d.count / maxCount) * (chartHeight - 50);
                return { x, y, label: d.label, count: d.count };
              });

              const pathD = points.length 
                ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
                : "";
                
              const areaD = points.length
                ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - 25} L ${points[0].x} ${chartHeight - 25} Z`
                : "";

              return (
                <div className="space-y-4">
                  <div className="relative w-full overflow-x-auto">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full min-w-[500px] h-36 overflow-visible">
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-brand-600)" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="var(--color-brand-600)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Grid Lines */}
                      <line x1="20" y1="25" x2={chartWidth - 20} y2="25" stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="3 3" />
                      <line x1="20" y1={chartHeight - 25} x2={chartWidth - 20} y2={chartHeight - 25} stroke="var(--color-border)" strokeWidth="1" />

                      {/* Area Fill */}
                      <path d={areaD} fill="url(#areaGradient)" />

                      {/* Path Line */}
                      <path d={pathD} fill="none" stroke="var(--color-brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                      {/* Dots and Tooltips */}
                      {points.map((p, idx) => (
                        <g key={idx} className="group">
                          {p.count > 0 && (
                            <circle cx={p.x} cy={p.y} r="3.5" fill="var(--color-brand-600)" stroke="var(--color-card)" strokeWidth="1" />
                          )}
                          <circle cx={p.x} cy={p.y} r="8" fill="transparent" className="cursor-pointer" />
                          <title>{`${p.count} vote${p.count !== 1 ? 's' : ''} at ${p.label}`}</title>
                        </g>
                      ))}

                      {/* X Axis Labels */}
                      {points.filter((_, idx) => idx % (timelineData.length > 10 ? 3 : 1) === 0).map((p, idx) => (
                        <text key={idx} x={p.x} y={chartHeight - 6} textAnchor="middle" className="text-[9px] fill-[var(--color-muted-fg)] font-semibold">
                          {p.label}
                        </text>
                      ))}
                    </svg>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </Card>

      {/* Integrations & Webhooks Hub */}
      <Card className="p-6 space-y-6 shadow-sm border border-brand-500/10 animate-fade-in-up">
        <div className="flex justify-between items-center border-b pb-3 border-[var(--color-border)] flex-wrap gap-2">
          <div>
            <h3 className="font-serif text-lg font-normal flex items-center gap-2">
              🔌 Workspace Integrations
            </h3>
            <p className="text-xs text-[var(--color-muted-fg)]">
              Connect poll events directly to Google Sheets, Slack, Discord, or custom server endpoints
            </p>
          </div>
          {data.poll?.webhook_url ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] bg-green-500/15 text-green-600 font-bold px-2 py-0.5 rounded-full dark:bg-green-900/20">
                ● Listening
              </span>
              <Button
                onClick={handleTestWebhook}
                disabled={testWebhookLoading}
                variant="secondary"
                size="sm"
                className="text-[10px] h-7 cursor-pointer"
              >
                {testWebhookLoading ? "Testing..." : "Send Test Post"}
              </Button>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] bg-[var(--color-subtle)] text-[var(--color-muted-fg)] font-bold px-2 py-0.5 rounded-full border border-[var(--color-border)]">
              Webhook Offline
            </span>
          )}
        </div>

        {testWebhookResult && (
          <div className={cn(
            "p-3 rounded-lg text-xs font-semibold border",
            testWebhookResult.ok 
              ? "bg-green-500/10 border-green-500/25 text-green-700" 
              : "bg-red-500/10 border-red-500/25 text-red-700"
          )}>
            {testWebhookResult.ok 
              ? "✓ Sample test POST payload successfully dispatched to your webhook URL!" 
              : `✗ Webhook dispatch failed: ${testWebhookResult.error}`}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-[var(--color-border)] pb-0.5">
          {(["sheets", "webhooks", "payload"] as const).map((tab) => {
            let label = "";
            if (tab === "sheets") label = "Google Sheets";
            else if (tab === "webhooks") label = "Slack & Discord";
            else if (tab === "payload") label = "JSON Payload Schema";

            return (
              <button
                key={tab}
                onClick={() => setActiveIntegrationTab(tab)}
                className={cn(
                  "pb-2 px-1 text-xs font-semibold cursor-pointer border-b-2 transition-all",
                  activeIntegrationTab === tab 
                    ? "border-brand-500 text-[var(--color-fg)]" 
                    : "border-transparent text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        {activeIntegrationTab === "sheets" && (
          <div className="space-y-4 text-xs leading-relaxed">
            <div className="space-y-1.5">
              <h4 className="font-semibold text-sm">Real-time Google Sheets Sync Guide</h4>
              <p className="text-[var(--color-muted-fg)]">
                Sync all votes in real-time to a Google Spreadsheet using a free Google Apps Script web application:
              </p>
            </div>
            <ol className="list-decimal pl-4 space-y-2 text-[var(--color-muted-fg)]">
              <li>Create a new Google Spreadsheet and open the sheet you want to log to.</li>
              <li>Click <strong>Extensions</strong> &gt; <strong>Apps Script</strong>.</li>
              <li>Delete all existing placeholder code, paste the script below, and save the project.</li>
              <li>Click <strong>Deploy</strong> &gt; <strong>New deployment</strong>. Select type <strong>Web app</strong>.</li>
              <li>Configure: <i>Execute as:</i> Me, and <i>Who has access:</i> Anyone.</li>
              <li>Copy the generated <strong>Web app URL</strong> and paste it as the Webhook URL in your poll&apos;s advanced settings.</li>
            </ol>
            <div className="space-y-1 bg-[var(--color-subtle)] p-3 rounded-lg border border-[var(--color-border)] font-mono text-[10px] text-[var(--color-fg)] overflow-x-auto relative">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  // Create headers if empty sheet
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Event Type", "Poll ID", "Voted At", "Option Selected"]);
  }
  
  sheet.appendRow([
    data.event || "poll.vote",
    data.poll_slug || data.poll_id,
    new Date(data.voted_at).toLocaleString(),
    data.option_ids ? data.option_ids.join(", ") : "Unknown Option"
  ]);
  
  return ContentService.createTextOutput("Success");
}`);
                }}
                className="absolute right-2 top-2 bg-[var(--color-card)] hover:bg-[var(--color-subtle)] text-[10px] px-2 py-1 rounded border border-[var(--color-border)] cursor-pointer"
              >
                Copy Code
              </button>
              <pre>{`function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  // Create headers if empty sheet
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Event Type", "Poll ID", "Voted At", "Option Selected"]);
  }
  
  sheet.appendRow([
    data.event || "poll.vote",
    data.poll_slug || data.poll_id,
    new Date(data.voted_at).toLocaleString(),
    data.option_ids ? data.option_ids.join(", ") : "Unknown Option"
  ]);
  
  return ContentService.createTextOutput("Success");
}`}</pre>
            </div>
          </div>
        )}

        {activeIntegrationTab === "webhooks" && (
          <div className="space-y-3 text-xs leading-relaxed">
            <h4 className="font-semibold text-sm">Slack & Discord Automated Block Styling</h4>
            <p className="text-[var(--color-muted-fg)]">
              SwiftPoll detects Slack and Discord webhook formats automatically. When you configure their webhook urls, we transform the raw JSON events into rich layout blocks:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-3 border border-[var(--color-border)] bg-[var(--color-subtle)] rounded-xl space-y-1.5">
                <span className="font-bold text-[var(--color-fg)]">💬 Discord Embeds</span>
                <p className="text-[var(--color-muted-fg)] text-[11px]">
                  Renders vote notifications inside a colored embed card containing poll question metadata, selection margins, timestamp, and result links.
                </p>
              </div>
              <div className="p-3 border border-[var(--color-border)] bg-[var(--color-subtle)] rounded-xl space-y-1.5">
                <span className="font-bold text-[var(--color-fg)]">💬 Slack Markdown Blocks</span>
                <p className="text-[var(--color-muted-fg)] text-[11px]">
                  Uses Slack&apos;s Block Kit markdown sections to present clean retrospectives, choice indicators, and direct result links inside your chat channel.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeIntegrationTab === "payload" && (
          <div className="space-y-3 text-xs leading-relaxed">
            <h4 className="font-semibold text-sm font-serif">Standard JSON Webhook Schema</h4>
            <p className="text-[var(--color-muted-fg)]">
              Custom server endpoints will receive HTTP POST requests with a raw JSON body matching the structure below:
            </p>
            <div className="bg-[var(--color-subtle)] p-3 rounded-lg border border-[var(--color-border)] font-mono text-[10px] text-[var(--color-fg)] overflow-x-auto">
              <pre>{`{
  "event": "poll.vote",
  "poll_id": "8afc4632-1594-4d89-980b-df783cb1a4bc",
  "poll_slug": "next-js-stacks",
  "question": "What is your primary choice for web frontend?",
  "option_ids": [
    "ff23ca3e-d890-482a-a9bd-83ca231bfa2b"
  ],
  "voted_at": "2026-07-07T11:42:10Z"
}`}</pre>
            </div>
          </div>
        )}
      </Card>

      {/* Raw Vote Log table */}
      <Card className="p-6 space-y-4 shadow-sm">
        <div>
          <h3 className="font-serif text-lg font-normal">Recent Activity Log</h3>
          <p className="text-xs text-[var(--color-muted-fg)]">Sequential stream of votes registered</p>
        </div>

        {totalVotes === 0 ? (
          <p className="py-6 text-center text-xs text-[var(--color-muted-fg)]">No logs available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-muted-fg)]">
                  <th className="py-2.5 font-medium">Timestamp</th>
                  <th className="py-2.5 font-medium">Selected Option</th>
                  <th className="py-2.5 font-medium text-right">Voter ID</th>
                </tr>
              </thead>
              <tbody>
                {data.votes?.slice(-15).reverse().map((vote) => {
                  const optMap: Record<string, string> = {};
                  data.options?.forEach(o => { optMap[o.id] = o.text; });
                  return (
                    <tr key={vote.id} className="border-b border-[var(--color-border)] last:border-none">
                      <td className="py-3 text-[var(--color-muted-fg)]">
                        {new Date(vote.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 font-medium">
                        {optMap[vote.option_id] || "Unknown Option"}
                      </td>
                      <td className="py-3 text-right font-mono text-[var(--color-muted-fg)]">
                        {vote.voter_id ? `${vote.voter_id.substring(0, 8)}…` : "Guest"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Collaborative Workspace Discussion Board */}
      {data.poll?.workspace_id && (
        <Card className="p-6 space-y-6 shadow-sm border border-brand-500/10 animate-fade-in-up">
          <div className="flex justify-between items-center border-b pb-3 border-[var(--color-border)]">
            <div>
              <h3 className="font-serif text-lg font-normal flex items-center gap-2">
                Workspace Discussion
              </h3>
              <p className="text-xs text-[var(--color-muted-fg)]">
                Private retrospective feedback thread for workspace team members
              </p>
            </div>
            <span className="text-[10px] bg-brand-500/10 text-brand-600 font-bold px-2.5 py-0.5 rounded-full dark:bg-brand-900/20">
              Workspace Only
            </span>
          </div>

          {/* Comments Feed List */}
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {comments.length === 0 ? (
              <p className="text-xs text-[var(--color-muted-fg)] text-center py-6 italic">
                No discussion comments yet. Be the first to start the retrospective!
              </p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 items-start group relative">
                    <div className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {comment.user_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="space-y-1 bg-[var(--color-subtle)] p-3 rounded-2xl max-w-xl text-xs relative flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[var(--color-fg)]">{comment.user_name}</span>
                        <span className="text-[9px] text-[var(--color-muted-fg)]">
                          {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[var(--color-fg)] break-words leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                      
                      {/* Delete button (displays on hover) */}
                      {currentUser?.id === comment.user_id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="absolute right-3 top-3 text-[10px] text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer font-bold"
                          title="Delete comment"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* New Comment Submission Form */}
          {currentUser ? (
            <form onSubmit={handlePostComment} className="flex gap-2 items-end">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a workspace retrospective note or feedback..."
                className="w-full min-h-[60px] p-3 text-xs bg-[var(--color-subtle)] border border-[var(--color-border)] rounded-xl outline-none focus:border-brand-500 transition-all text-[var(--color-fg)] resize-none"
                maxLength={400}
              />
              <Button type="submit" size="sm" className="h-10 cursor-pointer text-xs bg-[var(--color-fg)] text-[var(--color-bg)] hover:bg-[var(--color-muted-fg)] px-4">
                Send
              </Button>
            </form>
          ) : (
            <p className="text-xs text-[var(--color-muted-fg)] text-center">
              Please sign in to participate in the workspace discussion.
            </p>
          )}
        </Card>
      )}
    </main>
  );
}
