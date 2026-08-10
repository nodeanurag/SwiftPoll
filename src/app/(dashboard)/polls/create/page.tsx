"use client";

import { useDashboard } from "@/context/dashboard-context";
import { CreatePollForm } from "@/components/poll/create-poll-form";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function CreatePollPage() {
  const { activeWorkspace } = useDashboard();

  return (
    <div className="max-w-4xl mx-auto w-full px-6 py-12 space-y-8 animate-fade-in-up">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-fg tracking-tight">
          Create a New Poll
        </h1>
        <p className="text-xs text-muted-fg mt-1.5 leading-relaxed">
          Author questions, add custom choices, configure rate limits, and publish live polls instantly.
        </p>
      </div>

      {/* Spacious Notion-Style Container */}
      <Card className="border border-border bg-card p-6 sm:p-10 rounded-2xl shadow-lg relative overflow-hidden">
        <Suspense fallback={
          <div className="py-24 text-center text-xs text-muted-fg animate-pulse">
            Loading spacious editor controls...
          </div>
        }>
          <CreatePollForm workspaceId={activeWorkspace?.id} />
        </Suspense>
      </Card>
    </div>
  );
}
