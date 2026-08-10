-- Add views count column to polls table
alter table public.polls add column if not exists views integer not null default 0;

-- Add increment views RPC function
create or replace function public.increment_poll_views(poll_id uuid)
returns void as $$
begin
  update public.polls
  set views = views + 1
  where id = poll_id;
end;
$$ language plpgsql security definer;

-- Add vote_duration_ms column to votes table
alter table public.votes add column if not exists vote_duration_ms integer;
