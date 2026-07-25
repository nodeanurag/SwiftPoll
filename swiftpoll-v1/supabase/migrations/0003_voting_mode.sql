-- Add require_auth to polls table
alter table public.polls add column if not exists require_auth boolean not null default false;

-- Add user_id reference to votes table
alter table public.votes add column if not exists user_id uuid references auth.users(id) on delete set null;

-- Add index on votes(poll_id, user_id) for enforcing one vote per account efficiently
create index if not exists idx_votes_user_poll on public.votes (poll_id, user_id);
