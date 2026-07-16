"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import type { AnalyticsOption, PollAnalyticsResult } from "@/lib/actions/analytics";

export interface AnalyticsActivityLogProps {
  totalVotes: number;
  votes: PollAnalyticsResult["votes"];
  options: AnalyticsOption[];
}

export function AnalyticsActivityLog({
  totalVotes,
  votes,
  options,
}: AnalyticsActivityLogProps) {
  return <div>AnalyticsActivityLog Boilerplate</div>;
}
