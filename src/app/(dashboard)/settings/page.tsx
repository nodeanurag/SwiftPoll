"use client";

import { useDashboard } from "@/context/dashboard-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { activeWorkspace } = useDashboard();

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-xl mx-auto w-full animate-fade-in-up">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-3xl font-normal text-fg">Settings</h1>
        <p className="text-xs text-muted-fg mt-1">Configure general workspace settings and double-voting preferences.</p>
      </div>

      <Card className="p-6 border border-border bg-card rounded-2xl shadow-sm space-y-4">
        <h3 className="font-serif text-lg font-normal text-fg">
          Workspace settings
        </h3>
        <p className="text-xs text-muted-fg leading-relaxed">
          Configure security, default access controls, and preferences for <strong>{activeWorkspace?.name || "Personal Space"}</strong>.
        </p>

        <div className="space-y-4 pt-2">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-xs font-semibold text-fg">Restrict voting by IP</p>
              <p className="text-[10px] text-muted-fg">Enforce 1 vote per public IP address for free polls.</p>
            </div>
            <input type="checkbox" defaultChecked className="h-4.5 w-4.5 accent-brand-500" />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-xs font-semibold text-fg">Audit trails</p>
              <p className="text-[10px] text-muted-fg">Record modifications and deletion activity metrics.</p>
            </div>
            <input type="checkbox" defaultChecked className="h-4.5 w-4.5 accent-brand-500" />
          </label>
        </div>

        <Button className="w-full h-10 cursor-pointer mt-2">
          Save Settings
        </Button>
      </Card>
    </div>
  );
}
