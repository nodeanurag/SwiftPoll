"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { managePoll, editPollQuestion } from "@/lib/actions/manage-poll";
import { clearAdminToken, getAdminToken } from "@/lib/utils/fingerprint";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { getBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
