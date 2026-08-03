export const metadata = {
  title: "Privacy Policy",
  description: "Information regarding the collection, use, and security of user data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-[800px] px-6 py-16 space-y-8 animate-fade-in-up">
      <div className="space-y-2 border-b border-[var(--color-border)] pb-6">
        <h1 className="font-serif text-4xl font-normal tracking-tight text-[var(--color-fg)]">
          Privacy Policy
        </h1>
        <p className="text-xs text-[var(--color-muted-fg)]">
          Last Updated: July 7, 2026
        </p>
      </div>

      <div className="space-y-6 text-sm text-[var(--color-ash)] leading-relaxed">
        <p>
          At SwiftPoll, we value your privacy. This Privacy Policy details the types of information we collect, how we handle it, and the security measures we employ to safeguard your details when you use our platform.
        </p>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-[var(--color-fg)]">
            1. Information We Collect
          </h2>
          <p>
            We process data to deliver, optimize, and secure our polling services:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Google Account Information:</strong> If you sign in via Google OAuth to create polls or verify your vote, we receive your email address, profile picture, and basic account identifiers.
            </li>
            <li>
              <strong>Vote Verification Signatures:</strong> To ensure ballot integrity, we generate SHA-256 hashes of your IP address (combined with a cryptographic salt) and secure local storage browser fingerprints. The raw IP address is discarded immediately following verification.
            </li>
            <li>
              <strong>Poll Configuration Data:</strong> We store the titles, options, images, and administrative parameters that you submit when constructing a ballot.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-[var(--color-fg)]">
            2. How We Use Information
          </h2>
          <p>
            We utilize collected details for the following core operations:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>To compile and update real-time poll results and user dashboards.</li>
            <li>To enforce vote limits (e.g. max 5 votes per IP, or 1 vote per authenticated account).</li>
            <li>To trigger webhook integrations (such as Slack and Discord payloads) defined by creators.</li>
            <li>To monitor, debug, and optimize server-side database metrics and response rates.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-[var(--color-fg)]">
            3. Data Retention
          </h2>
          <p>
            Poll details and vote tallies are retained on our database servers until deleted by the creator. IP hashes used for rate-limiting calculations are kept in a temporary lookup table and purged regularly according to our system rotation rules.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-[var(--color-fg)]">
            4. Data Sharing & Third Parties
          </h2>
          <p>
            SwiftPoll does not sell, lease, or distribute your email addresses, identity profiles, or voting behaviors to third-party advertising companies. Data is only processed in connection with the platform database (Supabase) and authentication APIs (Google OAuth).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-[var(--color-fg)]">
            5. Your Choices & Controls
          </h2>
          <p>
            As a creator, you have full ownership of your polls. You can delete your polls at any time, which permanently removes all related options, responses, and metrics from our database tables.
          </p>
        </section>
      </div>
    </div>
  );
}
