"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useDashboard } from "@/context/dashboard-context";
import { 
  BarChart3, 
  Vote, 
  ExternalLink, 
  Loader,
  Trophy,
  ArrowUpRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
