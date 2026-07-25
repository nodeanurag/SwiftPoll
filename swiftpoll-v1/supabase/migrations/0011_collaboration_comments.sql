-- Create poll_comments table
create table if not exists public.poll_comments (
  id           uuid primary key default gen_random_uuid(),
  poll_id      uuid not null references public.polls(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  user_name    text not null,
  user_email   text not null,
  content      text not null,
  created_at   timestamptz not null default now()
);

-- Index for fast retrieval
create index if not exists idx_comments_poll_id on public.poll_comments(poll_id);

-- Enable replication for Realtime updates
alter table public.poll_comments replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.poll_comments;
  exception when duplicate_object then null;
  end;
end $$;

-- Enable Row Level Security (RLS)
alter table public.poll_comments enable row level security;

-- Policies:
-- 1. Anyone can read comments
drop policy if exists "public read comments" on public.poll_comments;
create policy "public read comments" on public.poll_comments for select using (true);

-- 2. Authenticated users can insert comments
drop policy if exists "authenticated insert comments" on public.poll_comments;
create policy "authenticated insert comments" on public.poll_comments for insert with check (auth.role() = 'authenticated');

-- 3. Users can delete their own comments
drop policy if exists "owner delete comments" on public.poll_comments;
create policy "owner delete comments" on public.poll_comments for delete using (auth.uid() = user_id);
