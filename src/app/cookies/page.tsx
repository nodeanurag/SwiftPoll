export const metadata = {
  title: "Cookie Policy",
  description: "Details about the cookies and tracking technologies used on SwiftPoll.",
};

export default function CookiePage() {
  return (
    <div className="mx-auto w-full max-w-[800px] px-6 py-16 space-y-8 animate-fade-in-up">
      <div className="space-y-2 border-b border-[var(--color-border)] pb-6">
        <h1 className="font-serif text-4xl font-normal tracking-tight text-[var(--color-fg)]">
          Cookie Settings & Policy
        </h1>
        <p className="text-xs text-[var(--color-muted-fg)]">
          Last Updated: July 7, 2026
        </p>
      </div>

      <div className="space-y-6 text-sm text-[var(--color-ash)] leading-relaxed">
        <p>
          SwiftPoll uses cookies, local storage, and similar technologies to ensure core functionality, security, and a seamless user experience. Below is a detailed breakdown of how we utilize these technologies.
        </p>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-[var(--color-fg)]">
            1. What are Cookies and Local Storage?
          </h2>
          <p>
            Cookies are small text files stored by your browser when you visit a website. Local Storage is a modern browser-based storage mechanism that allows sites to persist key-value pairs locally on your device with higher capacity and security than cookies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-[var(--color-fg)]">
            2. Categories of Storage We Use
          </h2>
          <div className="space-y-4">
            <div className="border border-[var(--color-border)] p-4 rounded-xl space-y-2">
              <h3 className="font-semibold text-sm text-[var(--color-fg)]">
                Essential / Functional Storage
              </h3>
              <p className="text-xs text-[var(--color-ash)]">
                Required for the Service to function properly. This includes:
              </p>
              <ul className="list-disc pl-5 text-xs text-[var(--color-ash)] space-y-1">
                <li><strong>Supabase Auth Tokens:</strong> Cookies/local storage keys used to store active OAuth sessions, verifying your identity when editing polls or logging in.</li>
                <li><strong>Admin Tokens:</strong> Locally stored private tokens generated when creating a poll, granting you access to close or delete that specific poll without requiring an account.</li>
              </ul>
            </div>

            <div className="border border-[var(--color-border)] p-4 rounded-xl space-y-2">
              <h3 className="font-semibold text-sm text-[var(--color-fg)]">
                Ballot Security & Anti-Fraud Storage
              </h3>
              <p className="text-xs text-[var(--color-ash)]">
                Used to verify voter actions and prevent duplicate submissions:
              </p>
              <ul className="list-disc pl-5 text-xs text-[var(--color-ash)] space-y-1">
                <li><strong>Voter Fingerprints:</strong> A unique cryptographic hash representing browser parameters, stored locally to detect whether a device has already cast a ballot in a specific poll.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-[var(--color-fg)]">
            3. Third-Party Analytics & Tracking
          </h2>
          <p>
            SwiftPoll does not load invasive third-party marketing trackers, retargeting pixels, or behavioral advertising cookies. We keep our codebase lean, minimal, and highly private.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-[var(--color-fg)]">
            4. How to Control Cookies
          </h2>
          <p>
            You can modify your browser settings to reject cookies or clear local storage items at any time. However, please note that clearing local storage will remove your local Admin Tokens, which may restrict your ability to moderate polls you previously created without signing in.
          </p>
        </section>
      </div>
    </div>
  );
}
