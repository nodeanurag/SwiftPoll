-- SwiftPoll — initial schema
-- Run this in the Supabase SQL editor (or via the Supabase CLI).

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────

create table if not exists public.polls (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  question     text not null,
  type         text not null default 'single' check (type in ('single', 'multiple')),
  hide_results boolean not null default false,
  closed       boolean not null default false,
  closes_at    timestamptz,
  created_at   timestamptz not null default now()
);

create table if not exists public.poll_options (
  id         uuid primary key default gen_random_uuid(),
  poll_id    uuid not null references public.polls(id) on delete cascade,
  text       text not null,
  position   int not null,
  created_at timestamptz not null default now()
);

create table if not exists public.votes (
  id         uuid primary key default gen_random_uuid(),
  poll_id    uuid not null references public.polls(id) on delete cascade,
  option_id  uuid not null references public.poll_options(id) on delete cascade,
  voter_id   text,
  ip_hash    text,
  created_at timestamptz not null default now()
);

-- Secret token that lets the creator manage a poll (no login required).
-- Kept in a separate table because RLS is row-level, not column-level — this
-- way the public read policy on `polls` can never leak the token. This table
-- has RLS enabled with NO policies, so only the service-role key can read it.
create table if not exists public.poll_secrets (
  poll_id     uuid primary key references public.polls(id) on delete cascade,
  admin_token text unique not null,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────

create index if not exists idx_polls_slug     on public.polls(slug);
create index if not exists idx_options_poll_id on public.poll_options(poll_id);
create index if not exists idx_votes_poll_id   on public.votes(poll_id);
create index if not exists idx_votes_option_id on public.votes(option_id);

-- ─────────────────────────────────────────────────────────────
-- Realtime
-- Emit full row data on changes and publish the tables the client subscribes to.
-- ─────────────────────────────────────────────────────────────

alter table public.votes replica identity full;
alter table public.polls replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.votes;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.polls;
  exception when duplicate_object then null;
  end;
end $$;

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- Public can READ polls / options / votes (needed for SSR + Realtime). No anon
-- write policies exist, and poll_secrets has no policies at all, so the only
-- way to write — or to read a token — is via server actions using the
-- service-role key, which bypasses RLS.
-- ─────────────────────────────────────────────────────────────

alter table public.polls        enable row level security;
alter table public.poll_options enable row level security;
alter table public.votes        enable row level security;
alter table public.poll_secrets enable row level security;

drop policy if exists "public read polls"        on public.polls;
drop policy if exists "public read poll_options" on public.poll_options;
drop policy if exists "public read votes"        on public.votes;

create policy "public read polls"        on public.polls        for select using (true);
create policy "public read poll_options" on public.poll_options for select using (true);
create policy "public read votes"        on public.votes        for select using (true);
-- (intentionally: no policies on public.poll_secrets)
