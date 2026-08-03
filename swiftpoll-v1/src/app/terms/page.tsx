import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Terms of Service",
  description: "Terms and conditions governing the use of SwiftPoll services.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-[800px] px-6 py-16 space-y-8 animate-fade-in-up">
      <div className="space-y-2 border-b border-[var(--color-border)] pb-6">
        <h1 className="font-serif text-4xl font-normal tracking-tight text-[var(--color-fg)]">
          Terms of Service
        </h1>
        <p className="text-xs text-[var(--color-muted-fg)]">
          Last Updated: July 7, 2026
        </p>
      </div>

      <div className="space-y-6 text-sm text-[var(--color-ash)] leading-relaxed">
        <p>
          Welcome to SwiftPoll. By accessing or using our website, services, or API endpoints (collectively, the &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use the Service.
        </p>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-[var(--color-fg)]">
            1. Use of the Service
          </h2>
          <p>
            SwiftPoll provides a platform that allows users to create, distribute, and vote in real-time polls. You agree to use the Service only for lawful purposes and in accordance with these Terms. You are solely responsible for any content you publish or distribute through our Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-[var(--color-fg)]">
            2. Creator Accounts & Authentication
          </h2>
          <p>
            While certain aspects of the Service do not require registration, advanced options and administrative consoles require authenticating via Google OAuth. You are responsible for maintaining the confidentiality of your credentials and for all activities that occur under your session.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-[var(--color-fg)]">
            3. Prohibited Content & Behavior
          </h2>
          <p>
            You agree not to publish, link to, or distribute any content that:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Is illegal, defamatory, harmful, abusive, or threatening.</li>
            <li>Infringes upon intellectual property rights of any party.</li>
            <li>Attempts to manipulate vote tallies through bots, scripts, or Sybil attacks.</li>
            <li>Contains malicious software, viruses, or phishing links.</li>
          </ul>
          <p>
            SwiftPoll reserves the right, in its sole discretion, to remove any poll or content that violates these guidelines.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-[var(--color-fg)]">
            4. Rate Limiting & Fraud Prevention
          </h2>
          <p>
            To maintain service integrity, SwiftPoll implements client-side fingerprinting and database-backed IP hashing to enforce voting limits. Attempting to bypass these mechanisms constitutes a violation of these Terms and may result in the immediate termination of access to your polls.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-[var(--color-fg)]">
            5. Limitation of Liability
          </h2>
          <p>
            THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS. SWIFTPOLL DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED. IN NO EVENT SHALL SWIFTPOLL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF YOUR USE OF THE SERVICE.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-[var(--color-fg)]">
            6. Modifications to Terms
          </h2>
          <p>
            We reserve the right to modify these Terms at any time. Changes will be posted directly to this page and will become effective immediately upon publication.
          </p>
        </section>
      </div>
    </div>
  );
}
