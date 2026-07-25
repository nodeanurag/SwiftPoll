-- Create api_keys table
create table if not exists public.api_keys (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  key_hash   text not null unique,
  masked_key text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.api_keys enable row level security;

-- Indexing hash for lookup performance and user_id for list performance
create index if not exists idx_api_keys_hash on public.api_keys(key_hash);
create index if not exists idx_api_keys_user on public.api_keys(user_id);
