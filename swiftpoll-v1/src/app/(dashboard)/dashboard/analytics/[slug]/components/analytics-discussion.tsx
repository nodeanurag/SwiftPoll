"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getBrowserClient } from "@/lib/supabase/client";
import { 
  getPollComments, 
  postPollComment, 
  deletePollComment, 
  PollComment 
} from "@/lib/actions/comments";
import { cn } from "@/lib/utils/cn";

export interface AnalyticsDiscussionProps {
  pollId: string;
  workspaceId: string;
  slug: string;
  currentUser: { id: string } | null;
}

export function AnalyticsDiscussion({
  pollId,
  workspaceId,
  slug,
  currentUser,
}: AnalyticsDiscussionProps) {
  const [comments, setComments] = useState<PollComment[]>([]);
  const [commentText, setCommentText] = useState("");

  // Comments Load Effect
  useEffect(() => {
    if (!pollId) return;
    
    async function loadComments() {
      const res = await getPollComments(pollId);
      if (res.ok && res.data) {
        setComments(res.data);
      }
    }
    
    void loadComments();
  }, [pollId]);

  // Realtime comments subscription
  useEffect(() => {
    if (!pollId) return;

    const supabase = getBrowserClient();
    const commentsChannel = supabase
      .channel(`poll-comments-${pollId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "poll_comments",
          filter: `poll_id=eq.${pollId}`,
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
  }, [pollId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !pollId) return;
    
    try {
      const supabase = getBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await postPollComment(pollId, commentText, token);
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

  return (
    <Card className="p-6 space-y-6 shadow-sm border border-brand-500/10 bg-card text-fg">
      <div className="flex justify-between items-center border-b pb-3 border-[var(--color-border)]">
        <div>
          <h3 className="font-serif text-lg font-normal flex items-center gap-2 text-fg">
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
                <div className="space-y-1 bg-[var(--color-subtle)] p-3 rounded-2xl max-w-xl text-xs relative flex-1 text-fg">
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

      {/* Comment Submission Form Placeholder */}
      <div>Form Placeholder</div>
    </Card>
  );
}
