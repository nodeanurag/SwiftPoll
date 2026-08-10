-- Create rate limits table
create table if not exists public.rate_limits (
  id         uuid primary key default gen_random_uuid(),
  ip_hash    text not null,
  action     text not null,
  created_at timestamptz not null default now()
);

-- Index for fast counts
create index if not exists idx_rate_limits_lookup on public.rate_limits (ip_hash, action, created_at);

-- Enable RLS on rate_limits (keep it completely private/locked so only server can read/write)
alter table public.rate_limits enable row level security;
-- (intentionally: no public read/write policies on public.rate_limits)
