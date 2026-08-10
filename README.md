# SwiftPoll ◆

The fastest way to run a live poll. **Create a question → share one link → watch
results update in real time.** No accounts, no logins, no friction.

Built with Next.js (App Router) · TypeScript · Tailwind CSS v4 · Supabase
(Postgres + Realtime) · Zod.

---

## Features

- **Instant poll creation** — one question, 2–10 options, fields appear as you type.
- **Single- or multiple-choice** polls.
- **Live results** — counts and animated bars update in real time via Supabase
  Realtime (incremental, no full refetch).
- **Anonymous voting** — one click, no sign-up.
- **Creator controls without accounts** — each poll returns a secret admin token
  (stored in your browser) that lets you **close**, **reopen**, or **delete** it.
- **Poll options** — hide results until a visitor votes; optional auto-close time.
- **Share fast** — copy link, QR code, or native share sheet.
- **Polished UX** — optimistic voting, dark mode, full keyboard a11y, reduced-motion
  support, and graceful loading / empty / error / not-found states.

---

## Quick start

### 1. Install

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run the migration in
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   It creates the tables, indexes, enables Realtime, and configures Row Level
   Security.
3. In **Project Settings → API**, copy your project URL, the `anon` key, and the
   `service_role` key.

### 3. Configure environment

Copy the example and fill in your keys:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # SERVER ONLY — never NEXT_PUBLIC
IP_HASH_SALT=some-random-string                   # optional
```

### 4. Run

```bash
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # vitest unit tests
```

---

## How it works

### Security model

- **RLS is enabled** on every table. The public (anon) key can only **read**
  polls, options, and votes — exactly what SSR and Realtime need.
- **All writes** go through Next.js **Server Actions** using the `service_role`
  key, which bypasses RLS. The browser never writes directly.
- The secret **admin token** lives in its own `poll_secrets` table that has RLS
  enabled with **no policies**, so it can never be read by the anon key — only
  the server can verify it.

### Real-time

The poll page subscribes to `INSERT`s on `votes` (filtered by poll) and
increments counts from the event payload. A voter's own vote is applied
optimistically and de-duplicated against its Realtime echo (by vote id and
voter id) so it is never double-counted. The page also listens for poll
`UPDATE`s to reflect close/reopen live.

### Spam prevention

- **Client:** a per-browser id + per-poll flag in `localStorage` (a returning
  voter sees results instead of the ballot).
- **Server:** an in-memory IP rate limiter (max 5 votes per IP per poll; IPs are
  SHA-256 hashed). This is per-instance and resets on redeploy — fine for an MVP.
  For production scale, move it to a `rate_limits` table or Redis.

### A note on percentages

Each option's percentage is `option_votes / total_votes`. For **multiple-choice**
polls this is the share of *total selections* (a voter can pick several), not the
share of voters.

---

## Project structure

```
src/
├── app/
│   ├── layout.tsx, page.tsx (create), globals.css
│   └── p/[slug]/ page.tsx, loading.tsx, not-found.tsx
├── components/
│   ├── ui/    button, input, textarea, card, loader
│   └── poll/  create-poll-form, poll-view, vote-options, results-view,
│              result-bar, share-panel, manage-panel, live-badge
├── lib/
│   ├── supabase/   client.ts (anon, browser), server.ts (service role)
│   ├── actions/    create-poll.ts, vote.ts, manage-poll.ts  (server actions)
│   ├── queries/    polls.ts  (SSR aggregation)
│   ├── validations/poll.ts   (Zod schemas)
│   └── utils/      slug, rate-limit, fingerprint, percentage, cn
└── types/          poll.ts, db.ts
supabase/migrations/0001_init.sql
```

---

## Deploy to Vercel

1. Push to GitHub.
2. Import the repo in Vercel (Next.js is auto-detected).
3. Add the three environment variables (and optional `IP_HASH_SALT`) in
   **Project Settings → Environment Variables**.
4. Deploy. Update `metadataBase` in `src/app/layout.tsx` to your production URL.

---

## QA checklist

- [ ] Home page loads with the create form (question + 2 option inputs).
- [ ] A new option field appears as you type; max 10; options can be removed down to 2.
- [ ] Validation blocks empty questions, duplicate options, and <2 options.
- [ ] Creating a poll redirects to `/p/[slug]`.
- [ ] The poll page shows the question and options.
- [ ] Single-choice: clicking an option votes immediately and reveals results.
- [ ] Multiple-choice: select several, then **Submit vote**.
- [ ] Results show correct counts and percentages; bars animate; the leader is highlighted.
- [ ] Revisiting from the same browser shows results, not the ballot.
- [ ] Voting in a second browser/tab updates counts live everywhere ("LIVE" badge).
- [ ] Copy link works; QR code scans to the poll; native share appears on mobile.
- [ ] Creator (poll's browser) sees **Close / Delete**; closing disables voting live; delete removes the poll.
- [ ] "Hide results until vote" keeps results hidden for non-voters.
- [ ] A poll past its close time shows final results only.
- [ ] An unknown slug shows the not-found page.
- [ ] Mobile layout is comfortable; dark mode follows the system.

---

Built for speed. ◆
