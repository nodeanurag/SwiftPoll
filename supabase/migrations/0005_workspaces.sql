-- 1. Workspaces Table
create table if not exists public.workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- 2. Workspace Members Table
create table if not exists public.workspace_members (
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete cascade,
  role         text not null check (role in ('owner', 'admin', 'member')),
  created_at   timestamptz default now(),
  primary key (workspace_id, user_id)
);

-- 3. Add workspace_id to polls table
alter table public.polls add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;

-- Enable Realtime for workspaces
alter table public.workspaces replica identity full;

-- Enable RLS for security (prevents client-side bypass)
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
