"use client";

import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = getBrowserClient();

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 px-6 text-center">
    </div>
  );
}
