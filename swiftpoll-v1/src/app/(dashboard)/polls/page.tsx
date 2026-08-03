"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDashboard, PollListItem } from "@/context/dashboard-context";
import { 
  BarChart3, 
  Copy, 
  ExternalLink, 
  Search, 
  Trash2, 
  FolderOpen,
  Loader,
  Plus
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { managePoll } from "@/lib/actions/manage-poll";
import { getAdminToken, clearAdminToken } from "@/lib/utils/fingerprint";
import { cn } from "@/lib/utils/cn";

export default function MyPollsPage() {
  const router = useRouter();
  const { 
    sessionToken, 
    polls, 
    setPolls, 
    loadingPolls, 
    currentTime,
    error,
    setError
  } = useDashboard();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">("all");
  const [sortBy, setSortBy] = useState<"newest" | "votes">("newest");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [confirmDeleteSlug, setConfirmDeleteSlug] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const handleCopyLink = async (slug: string) => {
    try {
      const url = `${window.location.origin}/p/${slug}`;
      await navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleToggleClose = async (slug: string, isClosed: boolean) => {
    setActionBusy(slug + "-close");
    setError(null);

    const localAdminToken = getAdminToken(slug);

    const res = await managePoll({
      slug,
      adminToken: localAdminToken ?? undefined,
      action: isClosed ? "reopen" : "close",
    }, sessionToken);

    if (res.ok) {
      setPolls((prev) =>
        prev.map((p) => (p.slug === slug ? { ...p, closed: !isClosed } : p))
      );
    } else {
      setError(res.error ?? "Failed to toggle poll status.");
    }
    setActionBusy(null);
  };

  const handleDeletePoll = async (slug: string) => {
    setActionBusy(slug + "-delete");
    setError(null);

    const localAdminToken = getAdminToken(slug);

    const res = await managePoll({
      slug,
      adminToken: localAdminToken ?? undefined,
      action: "delete",
    }, sessionToken);

    if (res.ok) {
      setPolls((prev) => prev.filter((p) => p.slug !== slug));
      clearAdminToken(slug);
      
      // Remove from local storage slugs list
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("swiftpoll_created_polls_slugs");
        const slugs: string[] = stored ? JSON.parse(stored) : [];
        const filtered = slugs.filter((s) => s !== slug);
        localStorage.setItem("swiftpoll_created_polls_slugs", JSON.stringify(filtered));
      }
      setConfirmDeleteSlug(null);
    } else {
      setError(res.error ?? "Failed to delete the poll.");
    }
    setActionBusy(null);
  };

  const handleDuplicate = (poll: PollListItem) => {
    if (!poll.poll_options) return;
    const sorted = [...poll.poll_options].sort((a, b) => a.position - b.position);
    const optTexts = sorted.map((o) => o.text).join(",");
    const params = new URLSearchParams();
    params.set("question", poll.question);
    params.set("options", optTexts);
    params.set("requireAuth", String(poll.require_auth));

    router.push(`/polls/create?${params.toString()}`);
  };

  // Filter & Sort polls
  const filteredPolls = polls
    .filter((poll) => {
      const matchesSearch = poll.question.toLowerCase().includes(searchQuery.toLowerCase());
      const expired = poll.closes_at ? new Date(poll.closes_at).getTime() <= currentTime : false;
      const isLive = !poll.closed && !expired;

      if (statusFilter === "active") return matchesSearch && isLive;
      if (statusFilter === "closed") return matchesSearch && !isLive;
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "votes") {
        const vA = a.votes?.[0]?.count ?? 0;
        const vB = b.votes?.[0]?.count ?? 0;
        return vB - vA;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-3xl font-normal text-fg">My Polls</h1>
          <p className="text-xs text-muted-fg mt-1">Manage, duplicate, close, or delete your workspace polls.</p>
        </div>
        <Link href="/polls/create">
          <Button size="md" className="gap-2 cursor-pointer">
            <Plus className="h-4 w-4" /> Create Poll
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 dark:border-red-950/30 dark:bg-red-950/20 dark:text-red-300 text-sm shadow-sm">
          {error}
        </div>
      )}

      {/* Filter and Search Controls */}
      <Card className="p-4 border border-border bg-card shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Status Filter Tabs */}
        <div className="flex rounded-lg bg-subtle p-0.5 w-full md:w-auto">
          {(["all", "active", "closed"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-md capitalize transition-all cursor-pointer flex-1 md:flex-none text-center",
                statusFilter === status
                  ? "bg-card text-fg shadow-sm border border-border"
                  : "text-muted-fg hover:text-fg"
              )}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search & Sort Row */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-fg" />
            <Input
              placeholder="Search polls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs w-full"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as "newest" | "votes")}
            className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-fg focus:outline-none cursor-pointer"
          >
            <option value="newest">Sort by: Newest</option>
            <option value="votes">Sort by: Votes</option>
          </select>
        </div>
      </Card>

      {/* Poll list */}
      {loadingPolls ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader className="h-8 w-8 text-brand-500 animate-spin" />
          <p className="text-xs text-muted-fg">Loading your command center records...</p>
        </div>
      ) : filteredPolls.length === 0 ? (
        <Card className="text-center py-20 border border-dashed rounded-2xl bg-card p-6 flex flex-col items-center justify-center min-h-[300px] space-y-3">
          <div className="h-12 w-12 rounded-full bg-blue-950/30 flex items-center justify-center text-blue-400 border border-blue-900/30">
            <FolderOpen className="h-6 w-6" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-fg">No polls found</h3>
          <p className="text-xs text-muted-fg max-w-sm leading-relaxed">
            There are no polls matching the current search or filters. Click &ldquo;Create Poll&rdquo; above to launch a new one.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPolls.map((poll) => {
            const expired = poll.closes_at 
              ? new Date(poll.closes_at).getTime() <= currentTime 
              : false;
            const isLive = !poll.closed && !expired;
            const voteCount = poll.votes?.[0]?.count ?? 0;

            return (
              <Card key={poll.id} className="p-5 border border-border bg-card flex flex-col justify-between space-y-4 hover:border-brand-500/50 transition-all duration-200 shadow-sm">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border",
                      isLive 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    )}>
                      {isLive ? "Live" : "Closed"}
                    </span>
                    <span className="text-[10px] text-muted-fg font-medium">
                      Created {new Date(poll.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>

                  <h3 className="font-serif text-base font-semibold text-fg leading-snug line-clamp-2" title={poll.question}>
                    {poll.question}
                  </h3>

                  <div className="flex items-center gap-2 text-[10px] text-muted-fg pt-1">
                    <span className="bg-subtle border px-2 py-0.5 rounded-full capitalize">
                      {poll.require_auth ? "Google Sign-in" : "Public IP lock"}
                    </span>
                    <span>·</span>
                    <span className="font-semibold text-fg">{voteCount} votes submitted</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-3 border-border/50 gap-2">
                  <div className="flex gap-1 flex-wrap">
                    {/* Share */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopyLink(poll.slug)}
                      className="text-[10px] h-8 px-2.5"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copiedSlug === poll.slug ? "Copied" : "Share"}
                    </Button>

                    {/* View */}
                    <Link href={`/p/${poll.slug}`} target="_blank">
                      <Button variant="secondary" size="sm" className="text-[10px] h-8 px-2.5">
                        <ExternalLink className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </Link>

                    {/* Stats */}
                    <Link href={`/dashboard/analytics/${poll.slug}`}>
                      <Button variant="secondary" size="sm" className="text-[10px] h-8 px-2.5">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Stats
                      </Button>
                    </Link>

                    {/* Duplicate */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDuplicate(poll)}
                      className="text-[10px] h-8 px-2.5"
                      title="Duplicate Poll"
                    >
                      Duplicate
                    </Button>

                    {/* Reopen / Close toggle */}
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={actionBusy === poll.slug + "-close"}
                      onClick={() => handleToggleClose(poll.slug, poll.closed)}
                      className="text-[10px] h-8 px-2.5"
                    >
                      {poll.closed ? "Reopen" : "Close"}
                    </Button>
                  </div>

                  <div className="flex items-center">
                    {confirmDeleteSlug === poll.slug ? (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeletePoll(poll.slug)}
                        disabled={actionBusy === poll.slug + "-delete"}
                        className="text-[10px] h-8 px-2"
                      >
                        Confirm
                      </Button>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteSlug(poll.slug)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 p-2 rounded-xl transition-all cursor-pointer"
                        title="Delete Poll"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    
                    {confirmDeleteSlug === poll.slug && (
                      <button
                        onClick={() => setConfirmDeleteSlug(null)}
                        className="text-[10px] text-muted-fg px-2 hover:underline cursor-pointer font-semibold"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
