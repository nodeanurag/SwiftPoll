"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "@/context/dashboard-context";
import { getBrowserClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function ProfilePage() {
  const { user } = useDashboard();
  const supabase = getBrowserClient();

  const [displayName, setDisplayName] = useState("");
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Sync state with loaded user data
  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayName(user.user_metadata?.display_name || user.user_metadata?.full_name || "");
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      setStatus({ type: "error", message: "Display name cannot be empty." });
      return;
    }

    setUpdating(true);
    setStatus(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { 
          display_name: displayName.trim(),
          full_name: displayName.trim()
        }
      });

      if (error) throw error;
      setStatus({ type: "success", message: "Profile display name updated successfully!" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile details.";
      setStatus({ type: "error", message });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-xl mx-auto w-full animate-fade-in-up">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-3xl font-normal text-fg">Account Profile</h1>
        <p className="text-xs text-muted-fg mt-1">Manage your public account details and sign-in email.</p>
      </div>

      <Card className="p-6 border border-border bg-card rounded-2xl shadow-sm space-y-4">
        {/* Status Messages */}
        {status && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-normal ${
            status.type === "success" 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            {status.type === "success" ? (
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{status.type === "success" ? "Success" : "Error"}</p>
              <p className="mt-0.5 opacity-90">{status.message}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="profile-email" className="text-xs font-semibold text-fg">Sign-in Email</label>
            <Input
              id="profile-email"
              readOnly
              value={user?.email || ""}
              className="text-xs h-10 w-full bg-subtle/10 border-border/40 text-muted-fg focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          
          <div className="space-y-1">
            <label htmlFor="profile-display-name" className="text-xs font-semibold text-fg">Display Name</label>
            <Input
              id="profile-display-name"
              placeholder="e.g. Anurag Jha"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="text-xs h-10 w-full"
              disabled={updating}
            />
          </div>
        </div>

        <Button 
          onClick={handleUpdateProfile}
          disabled={updating}
          className="w-full h-10 cursor-pointer mt-2 bg-brand-500 hover:bg-brand-600 text-bg font-bold rounded-xl border-0 flex items-center justify-center gap-2"
        >
          {updating && <Loader2 className="h-4 w-4 animate-spin" />}
          {updating ? "Updating..." : "Update Profile"}
        </Button>
      </Card>
    </div>
  );
}
