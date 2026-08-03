import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-16 space-y-12 animate-fade-in-up">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="text-[var(--color-brand-500)] font-medium text-xs tracking-[0.12em] uppercase">
          Pricing
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-normal tracking-tight">
          Simple, transparent plans
        </h1>
        <p className="text-sm text-[var(--color-ash)] leading-relaxed">
          Create polls anonymously, upgrade your limits for free with Google Sign In, or get custom branding with our Enterprise tier.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
        {/* Free Plan */}
        <Card className="p-8 flex flex-col justify-between space-y-6 border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
          <div className="space-y-4">
            <div>
              <h3 className="font-serif text-2xl font-normal">Free Creator</h3>
              <p className="text-xs text-[var(--color-muted-fg)] mt-1">For quick, anonymous poll creation.</p>
            </div>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold font-serif">$0</span>
              <span className="text-xs text-[var(--color-muted-fg)] ml-1">/ forever</span>
            </div>
            <ul className="space-y-3 text-xs pt-4 border-t border-[var(--color-border)]">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <span>3 free polls per day</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <span>Basic IP rate-limiting</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <span>Anonymous dashboard history</span>
              </li>
            </ul>
          </div>
          <Link href="/">
            <Button variant="secondary" className="w-full text-xs">
              Start Building
            </Button>
          </Link>
        </Card>

        {/* Verified Plan */}
        <Card className="p-8 flex flex-col justify-between space-y-6 border-2 border-[var(--color-brand-500)] bg-[var(--color-card)] shadow-lg relative">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[var(--color-brand-500)] text-white text-[10px] uppercase tracking-wider font-semibold px-3 py-1 rounded-full shadow-sm">
            Popular Free Upgrade
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-serif text-2xl font-normal">Verified Creator</h3>
              <p className="text-xs text-[var(--color-muted-fg)] mt-1">Upgrade by logging in with Google.</p>
            </div>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold font-serif">$0</span>
              <span className="text-xs text-[var(--color-muted-fg)] ml-1">/ free account</span>
            </div>
            <ul className="space-y-3 text-xs pt-4 border-t border-[var(--color-border)]">
              <li className="flex items-center gap-2 font-medium">
                <Check className="h-4 w-4 text-[var(--color-brand-500)] shrink-0" />
                <span>15 polls per day</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[var(--color-brand-500)] shrink-0" />
                <span>Full Creator Dashboard</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[var(--color-brand-500)] shrink-0" />
                <span>Close & Reopen voting</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[var(--color-brand-500)] shrink-0" />
                <span>Track voting metrics</span>
              </li>
            </ul>
          </div>
          <Link href="/dashboard">
            <Button className="w-full text-xs shadow-sm">
              Sign In with Google
            </Button>
          </Link>
        </Card>

        {/* Enterprise Plan */}
        <Card className="p-8 flex flex-col justify-between space-y-6 border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
          <div className="space-y-4">
            <div>
              <h3 className="font-serif text-2xl font-normal">Enterprise</h3>
              <p className="text-xs text-[var(--color-muted-fg)] mt-1">For organizations and brand campaigns.</p>
            </div>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold font-serif">$29</span>
              <span className="text-xs text-[var(--color-muted-fg)] ml-1">/ month</span>
            </div>
            <ul className="space-y-3 text-xs pt-4 border-t border-[var(--color-border)]">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <span>Unlimited polls per day</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <span>Custom brand logos & styles</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <span>Dedicated subdomains</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <span>REST API access</span>
              </li>
            </ul>
          </div>
          <a href="mailto:conveytoanurag@gmail.com?subject=SwiftPoll%20Enterprise%20Inquiry" className="w-full">
            <Button variant="secondary" className="w-full text-xs">
              Contact Sales
            </Button>
          </a>
        </Card>
      </div>
    </div>
  );
}
