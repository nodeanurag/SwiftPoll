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

  return <div>AnalyticsIntegrations Boilerplate</div>;
}
