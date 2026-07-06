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
    </div>
  );
}
