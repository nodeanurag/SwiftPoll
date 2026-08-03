export const metadata = {
  title: "Security Info",
  description: "Detailed overview of the security measures and protocols on SwiftPoll.",
};

export default function SecurityPage() {
  return (
    <div className="mx-auto w-full max-w-[800px] px-6 py-16 space-y-8 animate-fade-in-up">
      <div className="space-y-2 border-b border-[var(--color-border)] pb-6">
        <h1 className="font-serif text-4xl font-normal tracking-tight text-[var(--color-fg)]">
          Security Information
        </h1>
        <p className="text-xs text-[var(--color-muted-fg)]">
          Last Updated: July 7, 2026
        </p>
      </div>

      <div className="space-y-6 text-sm text-[var(--color-ash)] leading-relaxed">
        <p>
          At SwiftPoll, we design our architecture with security as a core foundation. Below is a detailed technical overview of how we safeguard database queries, voter sessions, and client endpoints.
        </p>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-[var(--color-fg)]">
            1. Database Protection & Row Level Security (RLS)
          </h2>
          <p>
            We enforce strict Postgres Row Level Security (RLS) rules on our Supabase backend. Clients cannot execute direct write queries to the database. All voting events, poll creations, and deletions are securely proxied through verified Server Actions which invoke credentials from the high-privilege `service_role` key only after rigorous validation.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-[var(--color-fg)]">
            2. Anti-Voting Fraud & Hash Salt Protection
          </h2>
          <p>
            To prevent ballot stuffing while protecting user privacy, voter IP addresses are checked against our database using a SHA-256 hash algorithm combined with a high-entropy environment variable salt (`IP_HASH_SALT`).
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>We do not log or store raw IP addresses.</li>
            <li>The hashed signature is checked against a lookup table of cast ballots.</li>
            <li>Without the secret server-side salt, it is mathematically impossible to reverse-engineer the original voter IP from the hash database.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-[var(--color-fg)]">
            3. Session Authentication & Google OAuth
          </h2>
          <p>
            SwiftPoll integrates Google OAuth via Supabase Authentication. OAuth tokens are stored inside secure, client-side HTTP cookies or authenticated state objects. This allows us to offer robust verification checks (such as restricting a poll to verified Google accounts) without storing passwords or profile credentials on our servers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-[var(--color-fg)]">
            4. Webhook Integrity
          </h2>
          <p>
            Creators using webhook integrations (to push results to Slack, Discord, or custom servers) can specify custom destination URLs. We sanitize these targets to prevent server-side request forgery (SSRF) and dispatch payloads via standard secure HTTPS POST requests.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-[var(--color-fg)]">
            5. Reporting Vulnerabilities
          </h2>
          <p>
            We appreciate the efforts of security researchers in identifying potential issues. If you discover a vulnerability or security bug, please contact us directly. We review all reports promptly and deploy patches to protect our creator and voter communities.
          </p>
        </section>
      </div>
    </div>
  );
}
