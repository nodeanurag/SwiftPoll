"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { managePoll, editPollQuestion } from "@/lib/actions/manage-poll";
import { clearAdminToken, getAdminToken } from "@/lib/utils/fingerprint";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { getBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * Creator-only controls. Renders nothing unless this browser holds the poll's
 * admin token (saved in localStorage at creation time) or the current user is
 * the authenticated owner of the poll. The credentials are verified server-side on every action.
 */
export function ManagePanel({
  slug,
  isClosed,
  pollUserId,
  createdAt,
  initialQuestion,
}: {
  slug: string;
  isClosed: boolean;
  pollUserId: string | null;
  createdAt: string;
  initialQuestion: string;
}) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"close" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit Question States
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState(initialQuestion);
  const [savingQuestion, setSavingQuestion] = useState(false);

  const supabase = getBrowserClient();

  useEffect(() => {
    // Read local admin token
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(getAdminToken(slug));

    // Get current user session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSessionToken(session?.access_token);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setSessionToken(session?.access_token);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [slug, supabase]);

  // Edit Question Timer
  useEffect(() => {
    const calculateTimeLeft = () => {
      const createdTime = new Date(createdAt).getTime();
      const elapsed = (Date.now() - createdTime) / 1000;
      return Math.max(0, Math.ceil(100 - elapsed));
    };

    const initialLeft = calculateTimeLeft();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSecondsLeft(initialLeft);

    if (initialLeft <= 0) return;

    const timer = setInterval(() => {
      const left = calculateTimeLeft();
      setSecondsLeft(left);
      if (left <= 0) {
        clearInterval(timer);
        setIsEditing(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [createdAt]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditedQuestion(initialQuestion);
  }, [initialQuestion]);

  const hasAccess = token || (user && pollUserId && user.id === pollUserId);

  if (loading) return null;
  if (!hasAccess) return null;

  async function toggleClose() {
    setBusy("close");
    setError(null);
    const res = await managePoll({
      slug,
      adminToken: token ?? undefined,
      action: isClosed ? "reopen" : "close",
    }, sessionToken);
    setBusy(null);
    if (!res.ok) {
      setError(res.error ?? "Something went wrong.");
      return;
    }
    router.refresh();
  }

  async function remove() {
    setBusy("delete");
    setError(null);
    const res = await managePoll({
      slug,
      adminToken: token ?? undefined,
      action: "delete",
    }, sessionToken);
    if (!res.ok) {
      setBusy(null);
      setError(res.error ?? "Something went wrong.");
      return;
    }
    clearAdminToken(slug);
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/");
    }
  }

  async function saveQuestion() {
    const trimmed = editedQuestion.trim();
    if (!trimmed) {
      setError("Question cannot be empty.");
      return;
    }
    if (trimmed.length > 200) {
      setError("Question must be 200 characters or fewer.");
      return;
    }

    setSavingQuestion(true);
    setError(null);

    const res = await editPollQuestion({
      slug,
      newQuestion: trimmed,
      adminToken: token ?? undefined,
    }, sessionToken);

    setSavingQuestion(false);
    if (!res.ok) {
      setError(res.error ?? "Failed to save question.");
      return;
    }

    setIsEditing(false);
    router.refresh();
  }

  return (
    <div className="rounded-[var(--radius)] border border-dashed p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Creator controls</p>
          <p className="text-xs text-[var(--color-muted-fg)]">
            Only visible to you as the creator.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {secondsLeft > 0 && !isEditing && (
            <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
              Edit ({secondsLeft}s)
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={toggleClose} disabled={busy !== null || isEditing}>
            {busy === "close" ? <Loader /> : null}
            {isClosed ? "Reopen" : "Close"}
          </Button>
          {confirmDelete ? (
            <Button variant="danger" size="sm" onClick={remove} disabled={busy !== null || isEditing}>
              {busy === "delete" ? <Loader /> : null}
              Confirm delete
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} disabled={isEditing} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20">
              Delete
            </Button>
          )}
          {confirmDelete && (
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)} disabled={isEditing}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="mt-4 space-y-3 border-t pt-3 border-[var(--color-border)]">
          <div className="space-y-1">
            <label htmlFor="edit-question-input" className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">
              Edit Question ({secondsLeft}s left)
            </label>
            <input
              id="edit-question-input"
              type="text"
              value={editedQuestion}
              onChange={(e) => setEditedQuestion(e.target.value)}
              maxLength={200}
              className="w-full h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)] text-[var(--color-fg)]"
              disabled={savingQuestion}
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={saveQuestion} disabled={savingQuestion}>
              {savingQuestion ? <Loader /> : null}
              Save Changes
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setEditedQuestion(initialQuestion); }} disabled={savingQuestion}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
