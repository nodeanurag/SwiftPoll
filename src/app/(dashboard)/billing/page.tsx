"use client";

import { useDashboard } from "@/context/dashboard-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BillingPage() {
  const { user } = useDashboard();

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-xl mx-auto w-full animate-fade-in-up">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-3xl font-normal text-fg">Billing & Subscription</h1>
        <p className="text-xs text-muted-fg mt-1">Upgrade your daily quota, unlock audit logging, and manage invoices.</p>
      </div>

      <Card className="p-6 border border-border bg-card rounded-2xl shadow-sm space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-serif text-lg font-normal text-fg">Current Tier: Pro Creator</h3>
            <p className="text-[10px] text-muted-fg mt-0.5">Linked to account {user?.email}</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-brand-500/10 px-2 py-0.5 text-[9px] font-bold text-brand-500 border border-brand-500/20">
            Active
          </span>
        </div>

        <p className="text-xs text-muted-fg leading-relaxed">
          Your Pro account gives you a daily limit of **15 polls**, full collaborative workspaces, programmatical API keys, and audit log histories.
        </p>

        <Button variant="secondary" className="w-full h-10 cursor-pointer mt-2">
          Manage Subscription
        </Button>
      </Card>
    </div>
  );
}
