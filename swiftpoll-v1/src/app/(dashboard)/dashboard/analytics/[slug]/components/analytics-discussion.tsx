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

  return <div>AnalyticsDiscussion Boilerplate</div>;
}
