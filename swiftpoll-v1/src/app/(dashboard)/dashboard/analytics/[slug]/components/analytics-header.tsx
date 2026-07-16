"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AnalyticsHeaderProps {
  question?: string;
  activeViewers: { id: string; name: string; email: string }[];
  onExportCSV: () => void;
  onExportJSON: () => void;
}

export function AnalyticsHeader({
  question,
  activeViewers,
  onExportCSV,
  onExportJSON,
}: AnalyticsHeaderProps) {
  return (
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
          <h1 className="font-serif text-2xl sm:text-3xl font-normal leading-tight text-balance text-fg">
            {question}
          </h1>
        </div>
        <div className="flex gap-2 w-full sm:w-auto shrink-0">
          <Button onClick={onExportCSV} variant="secondary" size="sm" className="flex-1 sm:flex-none text-xs gap-1.5 cursor-pointer">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button onClick={onExportJSON} variant="secondary" size="sm" className="flex-1 sm:flex-none text-xs gap-1.5 cursor-pointer">
            <Download className="h-3.5 w-3.5" />
            Export JSON
          </Button>
        </div>
      </div>
    </div>
  );
}
