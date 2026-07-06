import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { CreatePollForm } from "@/components/poll/create-poll-form";
import { RecentPolls } from "@/components/poll/recent-polls";
import { AuthRedirectHandler } from "@/components/auth/auth-redirect-handler";
import { Zap, Link as LinkIcon, Shield, BarChart3, HelpCircle, Eye } from "lucide-react";

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

        {/* Feature Grid Section */}
        <section id="features" className="mx-auto max-w-5xl space-y-16">
          <div className="text-center space-y-4">
            <span className="text-[var(--color-violet-mist)] font-medium text-sm tracking-[0.12em] uppercase font-sans">
              PRODUCT HIGHLIGHTS
            </span>
            <h3 className="font-serif text-4xl sm:text-5xl font-normal tracking-[-0.02em]">
              Designed for modern engagement
            </h3>
            <p className="mx-auto max-w-xl text-[var(--color-ash)]">
              Skip the complexity of traditional form builders. SwiftPoll is streamlined for speed and readability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
            <div className="bg-[var(--color-pure-white)] border border-[var(--color-mist)] p-8 rounded-[24px] space-y-4 hover:border-[var(--color-violet-mist)] transition-colors duration-300">
              <div className="h-12 w-12 rounded-xl bg-[var(--color-parchment)] flex items-center justify-center text-[var(--color-aubergine-ink)]">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div className="text-xs font-semibold tracking-wider uppercase text-[var(--color-violet-mist)]">Poll Creator</div>
              <h4 className="font-serif text-xl font-normal">Collect opinions quickly</h4>
              <p className="text-sm text-[var(--color-ash)] leading-relaxed">
                Need instant feedback? Want to predict voter behavior? Looking for insights to inform your marketing strategy? Build a poll worth voting for—and get all the data you need.
              </p>
            </div>

            <div className="bg-[var(--color-pure-white)] border border-[var(--color-mist)] p-8 rounded-[24px] space-y-4 hover:border-[var(--color-violet-mist)] transition-colors duration-300">
              <div className="h-12 w-12 rounded-xl bg-[var(--color-parchment)] flex items-center justify-center text-[var(--color-aubergine-ink)]">
                <Shield className="h-6 w-6" />
              </div>
              <div className="text-xs font-semibold tracking-wider uppercase text-[var(--color-violet-mist)]">No Code Poll Builder</div>
              <h4 className="font-serif text-xl font-normal">Beautiful and easy to build</h4>
              <p className="text-sm text-[var(--color-ash)] leading-relaxed">
                Typeform’s drag and drop builder lets you easily make an online poll that looks beautiful within minutes—with zero coding. Embed and share it seamlessly, and get the data you’re after.
              </p>
            </div>

            <div className="bg-[var(--color-pure-white)] border border-[var(--color-mist)] p-8 rounded-[24px] space-y-4 hover:border-[var(--color-violet-mist)] transition-colors duration-300">
              <div className="h-12 w-12 rounded-xl bg-[var(--color-parchment)] flex items-center justify-center text-[var(--color-aubergine-ink)]">
                <Zap className="h-6 w-6" />
              </div>
              <div className="text-xs font-semibold tracking-wider uppercase text-[var(--color-violet-mist)]">Data Insights</div>
              <h4 className="font-serif text-xl font-normal">More data, better insights</h4>
              <p className="text-sm text-[var(--color-ash)] leading-relaxed">
                What happens when you keep your audience engaged? You get more responses than ever. Collect instant, actionable insights that help you make better decisions faster.
              </p>
            </div>
          </div>
        </section>

        {/* Quote Block */}
        <section className="mt-24 mx-auto max-w-3xl text-center space-y-4 bg-[var(--color-parchment)] rounded-[24px] p-12 border border-[var(--color-mist)]">
          <blockquote className="font-serif text-2xl sm:text-3xl font-normal italic leading-relaxed text-balance text-[var(--color-aubergine-ink)]">
            "Stop using ugly poll tools. Try Typeform for mobile-friendly, awesome surveys and forms."
          </blockquote>
          <div className="space-y-0.5">
            <div className="font-serif text-lg font-semibold text-[var(--color-aubergine-ink)]">Kenny Jahng</div>
            <div className="text-xs text-[var(--color-ash)] uppercase tracking-wider">Media &amp; Innovation Pastor</div>
          </div>
        </section>
      </div>
    </div>
  );
}
