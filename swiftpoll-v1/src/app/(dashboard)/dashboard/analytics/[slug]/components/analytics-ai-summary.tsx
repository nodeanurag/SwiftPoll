"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader as LoaderIcon } from "lucide-react";
import { getBrowserClient } from "@/lib/supabase/client";
import { getAdminToken } from "@/lib/utils/fingerprint";
import type { AnalyticsOption } from "@/lib/actions/analytics";
import type { PollAnalyticsResult } from "@/lib/actions/analytics";
