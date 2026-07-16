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
  return <div>AnalyticsIntegrations Boilerplate</div>;
}
