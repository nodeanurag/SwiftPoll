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

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [aiLoading, setAiLoading] = useState(false);

  return null;
}
