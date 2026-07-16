"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { testWebhookAction } from "@/lib/actions/integrations";
import type { PollAnalyticsResult } from "@/lib/actions/analytics";

export interface AnalyticsIntegrationsProps {
  poll: PollAnalyticsResult["poll"];
  slug: string;
}

export function AnalyticsIntegrations({
  poll,
  slug,
}: AnalyticsIntegrationsProps) {
  // Integration States
  const [testWebhookLoading, setTestWebhookLoading] = useState(false);
  const [testWebhookResult, setTestWebhookResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [activeIntegrationTab, setActiveIntegrationTab] = useState<"sheets" | "webhooks" | "payload">("sheets");

  const handleTestWebhook = async () => {
    if (!poll?.webhook_url) return;
    setTestWebhookLoading(true);
    setTestWebhookResult(null);
    try {
      const res = await testWebhookAction(poll.webhook_url, poll.question, slug);
      setTestWebhookResult(res);
    } catch (err: unknown) {
      const error = err as Error;
      setTestWebhookResult({ ok: false, error: error.message || "Request failed." });
    } finally {
      setTestWebhookLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-6 shadow-sm border border-brand-500/10 bg-card text-fg">
      <div className="flex justify-between items-center border-b pb-3 border-[var(--color-border)] flex-wrap gap-2">
        <div>
          <h3 className="font-serif text-lg font-normal text-fg flex items-center gap-2">
            🔌 Workspace Integrations
          </h3>
          <p className="text-xs text-[var(--color-muted-fg)]">
            Connect poll events directly to Google Sheets, Slack, Discord, or custom server endpoints
          </p>
        </div>
        {poll?.webhook_url ? (
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
        <div className="space-y-4 text-xs leading-relaxed text-[var(--color-muted-fg)]">
          <div className="space-y-1.5">
            <h4 className="font-semibold text-sm text-fg">Real-time Google Sheets Sync Guide</h4>
            <p>
              Sync all votes in real-time to a Google Spreadsheet using a free Google Apps Script web application:
            </p>
          </div>
          <ol className="list-decimal pl-4 space-y-2">
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
          <h4 className="font-semibold text-sm text-fg">Slack & Discord Automated Block Styling</h4>
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
          <h4 className="font-semibold text-sm font-serif text-fg">Standard JSON Webhook Schema</h4>
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
  );
}
