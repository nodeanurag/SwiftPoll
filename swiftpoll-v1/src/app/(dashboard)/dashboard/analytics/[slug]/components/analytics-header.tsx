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
  return <div>AnalyticsHeader Boilerplate</div>;
}
