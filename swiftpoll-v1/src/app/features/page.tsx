import { Card } from "@/components/ui/card";
import { 
  Zap, 
  ShieldCheck, 
  BarChart3, 
  Clock, 
  Smartphone, 
  LineChart 
} from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-16 space-y-12 animate-fade-in-up">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="text-[var(--color-brand-500)] font-medium text-xs tracking-[0.12em] uppercase">
          Capabilities
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-normal tracking-tight">
          Powerful tools for modern opinions
        </h1>
        <p className="text-sm text-[var(--color-ash)] leading-relaxed">
          SwiftPoll is designed from the ground up to offer real-time responsiveness, creator administrative power, and beautiful interfaces.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 space-y-4 border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
          <div className="h-10 w-10 rounded-lg bg-[var(--color-subtle)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-fg)]">
            <Zap className="h-5 w-5 text-amber-500 animate-pulse" />
          </div>
          <h3 className="font-serif text-xl font-normal">Real-Time Syncing</h3>
          <p className="text-xs text-[var(--color-muted-fg)] leading-relaxed">
            Witness options dynamically slide and update in real-time as users vote. Built on Supabase Realtime for instant synchronization across all devices.
          </p>
        </Card>

        <Card className="p-6 space-y-4 border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
          <div className="h-10 w-10 rounded-lg bg-[var(--color-subtle)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-fg)]">
            <ShieldCheck className="h-5 w-5 text-green-500" />
          </div>
          <h3 className="font-serif text-xl font-normal">IP & Device Rate Limiting</h3>
          <p className="text-xs text-[var(--color-muted-fg)] leading-relaxed">
            Prevent voting fraud natively. SwiftPoll checks unique device parameters and client IP hashes to ensure one vote per person.
          </p>
        </Card>

        <Card className="p-6 space-y-4 border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
          <div className="h-10 w-10 rounded-lg bg-[var(--color-subtle)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-fg)]">
            <BarChart3 className="h-5 w-5 text-[var(--color-brand-500)]" />
          </div>
          <h3 className="font-serif text-xl font-normal">Creator Dashboard</h3>
          <p className="text-xs text-[var(--color-muted-fg)] leading-relaxed">
            Track metrics and manage active polls in one central hub. View voter turnouts and metrics, close or reopen polls, and delete outdated entries in real time.
          </p>
        </Card>

        <Card className="p-6 space-y-4 border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
          <div className="h-10 w-10 rounded-lg bg-[var(--color-subtle)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-fg)]">
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
          <h3 className="font-serif text-xl font-normal">Poll Closures & Expiry</h3>
          <p className="text-xs text-[var(--color-muted-fg)] leading-relaxed">
            Set an optional close date and time on creation. SwiftPoll automatically closes the ballot at the specified timestamp to conclude voting cleanly.
          </p>
        </Card>

        <Card className="p-6 space-y-4 border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
          <div className="h-10 w-10 rounded-lg bg-[var(--color-subtle)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-fg)]">
            <Smartphone className="h-5 w-5 text-purple-500" />
          </div>
          <h3 className="font-serif text-xl font-normal">Mobile-First Designs</h3>
          <p className="text-xs text-[var(--color-muted-fg)] leading-relaxed">
            Every element is engineered with premium aesthetics and responsive design, providing a seamless user experience whether voters are on phones, tablets, or laptops.
          </p>
        </Card>

        <Card className="p-6 space-y-4 border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
          <div className="h-10 w-10 rounded-lg bg-[var(--color-subtle)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-fg)]">
            <LineChart className="h-5 w-5 text-pink-500" />
          </div>
          <h3 className="font-serif text-xl font-normal">Detailed Results Charts</h3>
          <p className="text-xs text-[var(--color-muted-fg)] leading-relaxed">
            Display winners clearly with custom brand-colored progress bars and check indicators highlighting the options voted for by the user.
          </p>
        </Card>
      </div>

      {/* Product visual section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center py-12 border-t border-[var(--color-border)] mt-16 pt-16">
        <div className="relative rounded-[24px] bg-[#f9f2fd] p-6 border border-[var(--color-border)] flex justify-center items-center overflow-hidden">
          <img 
            src="/control-center-graphic.png" 
            alt="Poll configuration interface" 
            className="rounded-xl shadow-lg w-full object-cover max-h-[300px] animate-float" 
          />
        </div>
        <div className="space-y-6">
          <span className="text-[var(--color-brand-500)] font-medium text-xs tracking-[0.12em] uppercase">
            Control Center
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight">
            Flexible controls without administrative bloat
          </h2>
        </div>
      </section>
    </div>
  );
}
