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

  return null;
}
