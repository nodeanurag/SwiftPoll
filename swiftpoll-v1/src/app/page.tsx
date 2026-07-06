import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { CreatePollForm } from "@/components/poll/create-poll-form";
import { RecentPolls } from "@/components/poll/recent-polls";
import { AuthRedirectHandler } from "@/components/auth/auth-redirect-handler";

export default function HomePage() {
  return (
    <div className="w-full">
      <AuthRedirectHandler />
      {/* Dark Editorial Hero Section */}
      <section className="relative w-full bg-[var(--color-aubergine-ink)] text-[var(--color-cream-canvas)] pt-20 pb-32 px-6 sm:px-12 overflow-hidden">
        {/* Subtle decorative Plum circle */}
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[var(--color-deep-plum)] opacity-50 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[var(--color-deep-plum)] opacity-50 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-4xl text-center space-y-6 relative z-10 animate-fade-in-up">
          <div className="inline-block text-[var(--color-violet-mist)] font-medium text-sm tracking-[0.12em] uppercase font-sans">
            Poll creator
          </div>
          
          <h1 className="font-serif text-5xl sm:text-7xl font-normal leading-[1.05] tracking-[-0.03em] text-balance">
            Make polls your audience loves
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-[var(--color-lavender-whisper)] font-normal opacity-90 leading-relaxed text-balance">
            Typeform’s powerful poll creator is built to help you get better results from every response.
          </p>

          <div className="pt-4">
            <a 
              href="#builder" 
              className="inline-flex h-12 items-center justify-center rounded-[var(--radius)] bg-[var(--color-cream-canvas)] px-8 text-base font-medium text-[var(--color-aubergine-ink)] transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
            >
              Start Building Free
            </a>
          </div>
        </div>
      </section>

      {/* Main Content Area - Cream Canvas */}
      <div className="bg-[var(--color-cream-canvas)] text-[var(--color-aubergine-ink)] py-20 px-6 sm:px-12">
        
        {/* Builder Container with Card */}
        <section id="builder" className="mx-auto max-w-3xl -mt-36 relative z-20 mb-24">
          <Card className="border border-[var(--color-border)] bg-[var(--color-pure-white)] p-8 sm:p-12 rounded-[24px] shadow-xl">
            <div className="mb-8 space-y-2">
              <h2 className="font-serif text-3xl font-normal tracking-tight">Create your poll</h2>
              <p className="text-sm text-[var(--color-ash)]">Fill in your question and add custom choices below.</p>
            </div>
            <Suspense fallback={<div className="py-12 text-center text-sm text-[var(--color-muted-fg)]">Loading form...</div>}>
              <CreatePollForm />
            </Suspense>
            <RecentPolls />
          </Card>
        </section>
      </div>
    </div>
  );
}
