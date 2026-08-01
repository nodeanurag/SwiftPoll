"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createPoll } from "@/lib/actions/create-poll";
import { saveAdminToken } from "@/lib/utils/fingerprint";
import { getBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  MAX_OPTIONS,
  MIN_OPTIONS,
  QUESTION_MAX,
} from "@/lib/validations/poll";
import type { PollType } from "@/types/poll";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader } from "@/components/ui/loader";
import { generateAISuggestions } from "@/lib/utils/ai-assistant";
import { GripVertical, Copy, Image as ImageIcon } from "lucide-react";
import { PreviewModal } from "./preview-modal";

const DEFAULT_EMOJIS = ["👍", "👎", "❤️", "🔥", "😂", "😢", "🎉", "😮", "👏", "💡"];

function getLocalCreatedPollCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem("swiftpoll_created_polls");
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return 0;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const valid = parsed.filter((timestamp: number) => timestamp > oneDayAgo);
    localStorage.setItem("swiftpoll_created_polls", JSON.stringify(valid));
    return valid.length;
  } catch {
    return 0;
  }
}

function recordLocalCreatedPoll(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("swiftpoll_created_polls");
    const parsed = raw ? JSON.parse(raw) : [];
    const valid = Array.isArray(parsed) ? parsed : [];
    valid.push(Date.now());
    localStorage.setItem("swiftpoll_created_polls", JSON.stringify(valid));
  } catch {
    // ignore
  }
}

function recordLocalCreatedPollSlug(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("swiftpoll_created_polls_slugs");
    const parsed = raw ? JSON.parse(raw) : [];
    const valid = Array.isArray(parsed) ? parsed : [];
    if (!valid.includes(slug)) {
      valid.push(slug);
    }
    localStorage.setItem("swiftpoll_created_polls_slugs", JSON.stringify(valid));
  } catch {
    // ignore
  }
}

export function CreatePollForm({ 
  workspaceId, 
  onOpenDevSettings 
}: { 
  workspaceId?: string | null;
  onOpenDevSettings?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const optionRefs = useRef<(HTMLInputElement | null)[]>([]);

  const searchParams = useSearchParams();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [fadingIndices, setFadingIndices] = useState<number[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [type, setType] = useState<PollType>("single");
  const [hideResults, setHideResults] = useState(false);
  const [requireAuth, setRequireAuth] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [closesAt, setClosesAt] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>(["👍", "❤️", "🎉", "🔥"]);
  const [optionImages, setOptionImages] = useState<string[]>(["", ""]);
  const [openImageInputs, setOpenImageInputs] = useState<number[]>([]);
  const [hideResultsUntilClose, setHideResultsUntilClose] = useState(false);
  const [voteLimit, setVoteLimit] = useState("");
  const [password, setPassword] = useState("");

  function updateOptionImage(index: number, value: string) {
    setOptionImages((prev) => prev.map((img, i) => (i === index ? value : img)));
  }

  function toggleImageInput(index: number) {
    setOpenImageInputs((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }

  function toggleEmojiSelection(emoji: string) {
    setSelectedEmojis((prev) => {
      const isSelected = prev.includes(emoji);
      if (isSelected) {
        if (prev.length <= MIN_OPTIONS) return prev;
        return prev.filter((x) => x !== emoji);
      } else {
        if (prev.length >= MAX_OPTIONS) return prev;
        return [...prev, emoji];
      }
    });
  }

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [aiLoading, setAiLoading] = useState(false);

  const handleAIAssistant = async () => {
    if (!question.trim()) return;
    setAiLoading(true);
    try {
      const { generateAiPollAction } = await import("@/lib/actions/ai");
      const res = await generateAiPollAction(question);
      if (res.ok && res.question) {
        setQuestion(res.question);
        if (res.type) {
          setType(res.type);
        }
        if (res.type === "rating" || res.type === "scale" || res.type === "reactions" || res.type === "text") {
          setOptions(["", ""]);
          setOptionImages(["", ""]);
        } else if (res.options && res.options.length > 0) {
          setOptions(res.options);
          setOptionImages(res.options.map(() => ""));
        }
      } else {
        // Fallback to local heuristics
        const suggestion = generateAISuggestions(question);
        setQuestion(suggestion.question);
        if (suggestion.type) {
          setType(suggestion.type);
        }
        if (suggestion.type === "rating" || suggestion.type === "scale") {
          setOptions(["", ""]);
          setOptionImages(["", ""]);
        } else {
          setOptions(suggestion.options);
          setOptionImages(suggestion.options.map(() => ""));
        }
      }
    } catch {
      // Fallback to local heuristics
      const suggestion = generateAISuggestions(question);
      setQuestion(suggestion.question);
      if (suggestion.type) {
        setType(suggestion.type);
      }
      setOptions(suggestion.options);
      setOptionImages(suggestion.options.map(() => ""));
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get("question");
    const opts = searchParams.get("options");
    const reqAuth = searchParams.get("requireAuth");
    const webUrl = searchParams.get("webhookUrl");

    if (q || opts || reqAuth || webUrl) {
      /* eslint-disable react-hooks/set-state-in-effect */
      if (q) setQuestion(q);
      if (reqAuth === "true") setRequireAuth(true);
      if (webUrl) setWebhookUrl(webUrl);
      if (opts) {
        const parsed = opts.split(",").map(o => o.trim()).filter(Boolean);
        setOptions([...parsed, ""]);
      }
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }

    // Load draft from localStorage on mount/when searchParams is not overriding
    try {
      const saved = localStorage.getItem("swiftpoll_draft_poll");
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.question) setQuestion(draft.question);
        if (draft.options) setOptions(draft.options);
        if (draft.type) setType(draft.type);
        if (draft.hideResults !== undefined) setHideResults(draft.hideResults);
        if (draft.requireAuth !== undefined) setRequireAuth(draft.requireAuth);
        if (draft.closesAt) setClosesAt(draft.closesAt);
        if (draft.webhookUrl) setWebhookUrl(draft.webhookUrl);
        if (draft.selectedEmojis) setSelectedEmojis(draft.selectedEmojis);
        if (draft.optionImages) setOptionImages(draft.optionImages);
        if (draft.hideResultsUntilClose !== undefined) setHideResultsUntilClose(draft.hideResultsUntilClose);
        if (draft.voteLimit) setVoteLimit(draft.voteLimit);
        if (draft.password) setPassword(draft.password);
      }
    } catch (e) {
      console.error("Failed to load draft:", e);
    }
  }, [searchParams]);

  // Auto-save draft on form state changes
  useEffect(() => {
    const hasContent = question.trim() || options.some(o => o.trim()) || type === "reactions";
    if (hasContent) {
      const draft = {
        question,
        options,
        selectedEmojis,
        optionImages,
        type,
        hideResults,
        requireAuth,
        closesAt,
        webhookUrl,
        hideResultsUntilClose,
        voteLimit,
        password
      };
      localStorage.setItem("swiftpoll_draft_poll", JSON.stringify(draft));
    } else {
      localStorage.removeItem("swiftpoll_draft_poll");
    }
  }, [question, options, selectedEmojis, optionImages, type, hideResults, requireAuth, closesAt, webhookUrl, hideResultsUntilClose, voteLimit, password]);

  // Auth & Rate Limit state
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | undefined>(undefined);
  const [anonymousCount, setAnonymousCount] = useState(0);
  const [dbUserCount, setDbUserCount] = useState(0);
  const [loadingLimits, setLoadingLimits] = useState(true);

  const supabase = getBrowserClient();

  useEffect(() => {
    // Update local storage count
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnonymousCount(getLocalCreatedPollCount());

    // Subscribe/Get user status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSessionToken(session?.access_token);
      setLoadingLimits(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setSessionToken(session?.access_token);
        setLoadingLimits(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Fetch database count of polls for logged-in user
  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDbUserCount(0);
      return;
    }

    const currentUserId = user.id;
    async function fetchUserPollCount() {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from("polls")
        .select("id", { count: "exact", head: true })
        .eq("user_id", currentUserId)
        .gte("created_at", oneDayAgo);

      if (!error && count !== null) {
        setDbUserCount(count);
      }
    }

    fetchUserPollCount();
  }, [user, supabase]);

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
    // Auto-append a fresh field when typing in the last one.
    if (value && index === options.length - 1 && options.length < MAX_OPTIONS) {
      setOptions((prev) => [...prev, ""]);
      setOptionImages((prev) => [...prev, ""]);
      // Focus on the next option input after it is rendered
      setTimeout(() => {
        optionRefs.current[index + 1]?.focus();
      }, 0);
    }
  }

  function duplicateOption(index: number) {
    if (options.length >= MAX_OPTIONS) return;
    const value = options[index];
    setOptions((prev) => {
      const updated = [...prev];
      updated.splice(index + 1, 0, value);
      return updated;
    });
    setOptionImages((prev) => {
      const updated = [...prev];
      updated.splice(index + 1, 0, prev[index] || "");
      return updated;
    });
  }

  function removeOptionWithAnimation(index: number) {
    if (options.length <= MIN_OPTIONS) return;
    setFadingIndices((prev) => [...prev, index]);
    setTimeout(() => {
      setOptions((prev) => prev.filter((_, i) => i !== index));
      setOptionImages((prev) => prev.filter((_, i) => i !== index));
      setFadingIndices((prev) => prev.filter((i) => i !== index));
    }, 200);
  }

  function handleDragStart(e: React.DragEvent, index: number) {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent, targetIndex: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    setOptions((prev) => {
      const updated = [...prev];
      const [draggedItem] = updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, draggedItem);
      return updated;
    });

    setOptionImages((prev) => {
      const updated = [...prev];
      const [draggedItem] = updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, draggedItem);
      return updated;
    });

    setDraggedIndex(null);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
  }

  const handleOptionKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (i === options.length - 1 && options.length < MAX_OPTIONS) {
        setOptions((prev) => [...prev, ""]);
        setOptionImages((prev) => [...prev, ""]);
        setTimeout(() => {
          optionRefs.current[i + 1]?.focus();
        }, 0);
      } else if (i < options.length - 1) {
        optionRefs.current[i + 1]?.focus();
      }
    }
  };

  const currentCount = user ? dbUserCount : anonymousCount;
  const maxLimit = user ? 15 : 3;
  const isLimitReached = currentCount >= maxLimit;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (isLimitReached) {
      if (!user) {
        setError("Anonymous limit reached (3 polls/day). Please sign in with Google to get 15 polls/day!");
      } else {
        setError("Limit reached (15 polls/day). Come back tomorrow!");
      }
      return;
    }

    if (webhookUrl && !/^https?:\/\//i.test(webhookUrl.trim())) {
      setError("Webhook URL must start with http:// or https://");
      return;
    }

    const cleanedOptions = type === "reactions"
      ? selectedEmojis
      : options.map((o) => o.trim()).filter(Boolean);
    let closesAtIso: string | null = null;
    if (closesAt) {
      const date = new Date(closesAt);
      if (Number.isNaN(date.getTime())) {
        setError("Invalid close date.");
        return;
      }
      closesAtIso = date.toISOString();
    }

    startTransition(async () => {
      const res = await createPoll({
        question,
        options: cleanedOptions,
        optionImages: type !== "rating" && type !== "scale" && type !== "reactions" ? optionImages : undefined,
        type,
        hideResults,
        requireAuth,
        workspaceId,
        webhookUrl,
        closesAt: closesAtIso,
        hideResultsUntilClose,
        voteLimit: voteLimit ? parseInt(voteLimit, 10) : undefined,
        password: password || undefined,
      }, sessionToken);

      if (!res.ok || !res.slug) {
        setError(res.error ?? "Could not create the poll.");
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        return;
      }

      if (!user) {
        recordLocalCreatedPoll();
        recordLocalCreatedPollSlug(res.slug);
      }
      localStorage.removeItem("swiftpoll_draft_poll");
      if (res.adminToken) saveAdminToken(res.slug, res.adminToken);
      router.push(`/p/${res.slug}`);
    });
  }

  const completionPercentage = (() => {
    let score = 0;
    if (question.trim()) score += 30;
    if (type === "reactions") {
      if (selectedEmojis.length > 0) score += 40;
    } else if (type === "rating" || type === "scale" || type === "text") {
      score += 40;
    } else {
      const nonBlankOpts = options.filter(o => o.trim()).length;
      if (nonBlankOpts >= 1) score += 20;
      if (nonBlankOpts >= 2) score += 20;
    }
    if (type !== "single") score += 15;
    if (hideResults || requireAuth || closesAt || webhookUrl || voteLimit || password) score += 15;
    return Math.min(100, score || 10);
  })();

  const filledCount = options.filter(o => o.trim()).length;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Question */}
      <div className="space-y-2">
        <label htmlFor="question" className="block text-sm font-medium">
          Your question
        </label>
        <div className="flex gap-2 items-start">
          <Textarea
            id="question"
            placeholder="What should we build next? (e.g. Try typing: 'best database')"
            value={question}
            maxLength={QUESTION_MAX}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1"
            autoFocus
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleAIAssistant}
            disabled={aiLoading}
            className="h-12 px-3.5 gap-1.5 shrink-0 text-xs font-semibold border border-purple-500/20 hover:border-purple-500/50 bg-gradient-to-r from-purple-50/50 to-pink-50/50 hover:from-purple-100/50 hover:to-pink-100/50 dark:from-purple-950/10 dark:to-pink-950/10 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20 text-purple-700 dark:text-purple-300 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer rounded-xl flex items-center justify-center"
          >
            {aiLoading ? <Loader className="h-3 w-3 animate-spin" /> : "✨ AI Assist"}
          </Button>
        </div>
        <div className="flex justify-between text-xs text-[var(--color-muted-fg)]">
          <span>{fieldErrors.question?.[0] && (
            <span className="text-red-600">{fieldErrors.question[0]}</span>
          )}</span>
          <span>
            {question.length}/{QUESTION_MAX}
          </span>
        </div>
      </div>

      {/* Options */}
      {type !== "rating" && type !== "scale" && type !== "reactions" && type !== "text" && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Options</label>
          <div className="space-y-2">
            {options.map((opt, i) => {
              const isFading = fadingIndices.includes(i);
              return (
                <div key={i} className="flex flex-col gap-1.5 w-full">
                  <div
                    draggable={!isFading}
                    onDragStart={(e) => handleDragStart(e, i)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, i)}
                    onDragEnd={handleDragEnd}
                    style={{
                      maxHeight: isFading ? "0px" : "64px",
                      transition: "all 200ms ease-in-out"
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-[var(--radius)] w-full overflow-hidden transition-all duration-200",
                      isFading && "opacity-0 -translate-x-4 py-0 my-0 border-0 pointer-events-none",
                      draggedIndex === i && "opacity-40 border border-dashed border-[var(--color-border)] bg-[var(--color-subtle)]"
                    )}
                  >
                    {/* Drag Handle */}
                    <div
                      className="flex h-12 w-8 shrink-0 items-center justify-center cursor-grab active:cursor-grabbing text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
                      title="Drag to reorder"
                    >
                      <GripVertical className="h-4 w-4" />
                    </div>

                    <Input
                      ref={(el) => {
                        optionRefs.current[i] = el;
                      }}
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      onKeyDown={(e) => handleOptionKeyDown(i, e)}
                      aria-label={`Option ${i + 1}`}
                      className="flex-1"
                    />

                    {/* Option Image Trigger */}
                    <button
                      type="button"
                      onClick={() => toggleImageInput(i)}
                      className={cn(
                        "flex h-12 w-10 shrink-0 items-center justify-center rounded-[var(--radius)] text-[var(--color-muted-fg)] transition-colors hover:bg-[var(--color-subtle)] hover:text-[var(--color-fg)] cursor-pointer",
                        openImageInputs.includes(i) && "text-brand-500 bg-[var(--color-subtle)]"
                      )}
                      title="Add option image URL"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </button>

                    {/* Duplicate Option */}
                    {options.length < MAX_OPTIONS && (
                      <button
                        type="button"
                        onClick={() => duplicateOption(i)}
                        aria-label={`Duplicate option ${i + 1}`}
                        className="flex h-12 w-10 shrink-0 items-center justify-center rounded-[var(--radius)] text-[var(--color-muted-fg)] transition-colors hover:bg-[var(--color-subtle)] hover:text-[var(--color-fg)] cursor-pointer"
                        title="Duplicate Option"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    )}

                    {options.length > MIN_OPTIONS && (
                      <button
                        type="button"
                        onClick={() => removeOptionWithAnimation(i)}
                        aria-label={`Remove option ${i + 1}`}
                        className="flex h-12 w-10 shrink-0 items-center justify-center rounded-[var(--radius)] text-[var(--color-muted-fg)] transition-colors hover:bg-[var(--color-subtle)] hover:text-red-600 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {openImageInputs.includes(i) && (
                    <div className="flex items-center gap-2 pl-10 w-full animate-fade-in-up">
                      <Input
                        placeholder="Image URL (e.g. https://images.unsplash.com/...)"
                        value={optionImages[i] || ""}
                        onChange={(e) => updateOptionImage(i, e.target.value)}
                        className="flex-1 text-xs"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {fieldErrors.options?.[0] && (
            <p className="text-xs text-red-600">{fieldErrors.options[0]}</p>
          )}
          <p className="text-xs text-[var(--color-muted-fg)]">
            {filledCount}/{MAX_OPTIONS} options · a new field appears as you type.
          </p>
        </div>
      )}

      {/* Emoji Reactions Selection Grid */}
      {type === "reactions" && (
        <div className="space-y-3">
          <label className="block text-sm font-medium">Reaction Emojis</label>
          <p className="text-xs text-[var(--color-muted-fg)]">
            Select the emojis you want to allow as reactions (choose between 2 and 10):
          </p>
          <div className="flex flex-wrap gap-2.5 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] justify-center">
            {DEFAULT_EMOJIS.map((emoji) => {
              const isSelected = selectedEmojis.includes(emoji);
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => toggleEmojiSelection(emoji)}
                  className={cn(
                    "h-12 w-12 rounded-full border text-2xl flex items-center justify-center transition-all duration-150 cursor-pointer hover:scale-110",
                    isSelected
                      ? "border-[var(--color-fg)] bg-[var(--color-subtle)] scale-110 shadow-sm"
                      : "border-[var(--color-border)] bg-[var(--color-bg)] opacity-60 hover:opacity-100"
                  )}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
          {fieldErrors.options?.[0] && (
            <p className="text-xs text-red-600">{fieldErrors.options[0]}</p>
          )}
          <p className="text-xs text-[var(--color-muted-fg)]">
            {selectedEmojis.length} reaction emojis selected.
          </p>
        </div>
      )}

      {/* Poll type */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Voting Mode</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {(["single", "multiple", "rating", "scale", "reactions", "ranking", "text"] as const).map((t) => {
            let label = "";
            if (t === "single") label = "Single";
            else if (t === "multiple") label = "Multiple";
            else if (t === "rating") label = "Rating";
            else if (t === "scale") label = "Scale";
            else if (t === "reactions") label = "Reactions";
            else if (t === "ranking") label = "Ranking";
            else if (t === "text") label = "Text";

            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                aria-pressed={type === t}
                className={cn(
                  "rounded-[var(--radius)] border px-3 py-2.5 text-xs font-medium transition-all duration-200 cursor-pointer",
                  type === t
                    ? "border-fg bg-fg text-bg shadow-sm"
                    : "border-border bg-transparent text-muted-fg hover:border-fg hover:bg-subtle hover:text-fg",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced */}
      {user ? (
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            aria-expanded={showAdvanced}
            className="text-sm font-medium text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
          >
            {showAdvanced ? "− Hide" : "+ More"} options
          </button>
          {showAdvanced && (
            <div className="mt-3 space-y-4 rounded-[var(--radius)] border border-dashed p-4 animate-fade-in-up">
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="text-sm">
                  <span className="font-medium">Hide results until vote</span>
                  <span className="block text-xs text-[var(--color-muted-fg)]">
                    Voters must pick before they can see the tally.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={hideResults}
                  onChange={(e) => setHideResults(e.target.checked)}
                  className="h-5 w-5 accent-brand-600"
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="text-sm">
                  <span className="font-medium">Require sign-in to vote</span>
                  <span className="block text-xs text-[var(--color-muted-fg)]">
                    Only Google authenticated users can vote. Enforces one vote per account.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={requireAuth}
                  onChange={(e) => setRequireAuth(e.target.checked)}
                  className="h-5 w-5 accent-brand-600"
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="text-sm">
                  <span className="font-medium">Hide results until poll closes</span>
                  <span className="block text-xs text-[var(--color-muted-fg)]">
                    Results are kept secret until the close timer is reached.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={hideResultsUntilClose}
                  onChange={(e) => setHideResultsUntilClose(e.target.checked)}
                  className="h-5 w-5 accent-brand-600"
                />
              </label>
              <div className="space-y-1.5">
                <label htmlFor="voteLimit" className="text-sm font-medium">
                  Vote Limit <span className="text-[var(--color-muted-fg)]">(optional)</span>
                </label>
                <Input
                  id="voteLimit"
                  type="number"
                  min="1"
                  placeholder="e.g. 100"
                  value={voteLimit}
                  onChange={(e) => setVoteLimit(e.target.value)}
                />
                <p className="text-[10px] text-[var(--color-muted-fg)]">
                  Closes the poll automatically after this number of votes is cast.
                </p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium">
                  Password Protection <span className="text-[var(--color-muted-fg)]">(optional)</span>
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password to restrict access"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-[10px] text-[var(--color-muted-fg)]">
                  Voters must enter this password to view the ballot and vote.
                </p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="webhookUrl" className="text-sm font-medium">
                  Webhook URL <span className="text-[var(--color-muted-fg)]">(optional)</span>
                </label>
                <Input
                  id="webhookUrl"
                  type="url"
                  placeholder="https://yourserver.com/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <p className="text-[10px] text-[var(--color-muted-fg)]">
                  Fires a JSON POST request payload to this URL when a new vote is submitted.
                </p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="closesAt" className="text-sm font-medium">
                  Close voting at <span className="text-[var(--color-muted-fg)]">(optional)</span>
                </label>
                <Input
                  id="closesAt"
                  type="datetime-local"
                  value={closesAt}
                  onChange={(e) => setClosesAt(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card className="border border-dashed border-[var(--color-border)] bg-[var(--color-subtle)] p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔒</span>
            <h4 className="font-serif text-base font-semibold text-[var(--color-fg)]">
              Unlock Advanced Settings
            </h4>
          </div>
          <p className="text-xs text-[var(--color-muted-fg)] leading-relaxed">
            Sign in with a free Google account to enable advanced controls on your polls:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs text-[var(--color-ash)] font-medium">
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-brand-500)] font-bold">✓</span>
              <span>Hide results until vote</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-brand-500)] font-bold">✓</span>
              <span>Restrict double-voting</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-brand-500)] font-bold">✓</span>
              <span>Custom expiry & limits</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-brand-500)] font-bold">✓</span>
              <span>Slack & Discord webhooks</span>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <span className="text-[var(--color-brand-500)] font-bold">✓</span>
              <span>Password protect poll access</span>
            </div>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
                  await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo }
                  });
                } catch (err) {
                  console.error(err);
                }
              }}
              className="w-full flex h-10 items-center justify-center gap-2.5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-xs font-semibold text-[var(--color-fg)] hover:bg-[var(--color-subtle)] hover:border-[var(--color-brand-500)] transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            >
              <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
              </svg>
              Sign in with Google to Unlock Options
            </button>
          </div>
        </Card>
      )}

      {/* Quota Info / Limit Warnings */}
      {!loadingLimits && (
        <div className={cn(
          "rounded-xl border p-4 text-sm transition-all duration-300",
          isLimitReached 
            ? "border-red-200 bg-red-50 text-red-800 dark:border-red-950/30 dark:bg-red-950/20 dark:text-red-300"
            : "border-[var(--color-border)] bg-[var(--color-subtle)] text-[var(--color-ash)]"
        )}>
          {user ? (
            <div className="flex items-center justify-between">
              <span>Daily quota: <strong>{currentCount} / {maxLimit}</strong> polls created</span>
              {isLimitReached && <span className="font-semibold text-red-600">Limit reached</span>}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Free daily quota: <strong>{currentCount} / {maxLimit}</strong> polls created</span>
                {isLimitReached && <span className="font-semibold text-red-600">Limit reached</span>}
              </div>
              {!isLimitReached ? (
                <p className="text-xs">
                  Create up to 3 polls for free. Sign in with Google to increase your limit to 15 polls/day.
                </p>
              ) : (
                <div className="space-y-2 pt-2 border-t border-red-200/50 dark:border-red-950/20">
                  <p className="text-xs font-medium">
                    You have reached the free limit of 3 polls per day. Please sign in with Google to get 15 polls/day.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
                        await supabase.auth.signInWithOAuth({
                          provider: "google",
                          options: { redirectTo }
                        });
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2.5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] px-5 text-sm font-medium text-[var(--color-fg)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-brand-500)] hover:bg-[var(--color-subtle)] hover:shadow-md active:translate-y-0 active:scale-[0.98] cursor-pointer"
                  >
                    <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 48 48">
                      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                    </svg>
                    Sign in with Google
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {user && onOpenDevSettings && (
        <div className="flex justify-end pr-1">
          <button
            type="button"
            onClick={onOpenDevSettings}
            className="text-xs font-semibold text-[var(--color-brand-500)] hover:text-[var(--color-brand-600)] transition-colors hover:underline cursor-pointer flex items-center gap-1"
          >
            ⚙️ Developer Settings
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="flex-1 cursor-pointer"
          onClick={() => setIsPreviewOpen(true)}
        >
          Preview Ballot
        </Button>
        <Button 
          type="submit" 
          size="lg" 
          className="flex-1" 
          disabled={pending || (!loadingLimits && isLimitReached)}
        >
          {pending ? <Loader /> : null}
          {pending ? "Creating…" : isLimitReached ? "Limit reached" : "Create poll"}
        </Button>
      </div>

      {/* Form Completion Progress Bar */}
      <div className="pt-4 border-t border-[var(--color-border)] space-y-2">
        <div className="flex justify-between items-center text-xs text-[var(--color-muted-fg)]">
          <span className="flex items-center gap-1 font-medium">
            Form Completion
            {completionPercentage === 100 && (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] animate-pulse">
                ✓ Ready
              </span>
            )}
          </span>
          <span className={cn(
            "font-semibold transition-colors duration-300",
            completionPercentage === 100 ? "text-emerald-600 dark:text-emerald-400" : "text-[var(--color-fg)]"
          )}>
            {completionPercentage}%
          </span>
        </div>
        <div className="w-full bg-[var(--color-subtle)] h-2 rounded-full overflow-hidden border border-[var(--color-border)]/30">
          <div 
            style={{ width: `${completionPercentage}%` }} 
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              completionPercentage === 100
                ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                : "bg-[var(--color-brand-500)]"
            )}
          />
        </div>
      </div>

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        question={question}
        options={type === "reactions" ? selectedEmojis : (type === "text" ? ["Response"] : options)}
        type={type}
        requireAuth={requireAuth}
      />
    </form>
  );
}
