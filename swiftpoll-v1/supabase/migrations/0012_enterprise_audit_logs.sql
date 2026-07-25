-- Create workspaces audit logs table
create table if not exists public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete set null,
  user_email   text not null,
  action       text not null, -- 'poll.create', 'poll.delete', 'poll.close', 'poll.reopen', 'member.invite'
  target_name  text not null, -- Name of the poll or email of invited member
  created_at   timestamptz not null default now()
);

-- Index for workspace retrieval speed
create index if not exists idx_audit_logs_workspace_id on public.audit_logs(workspace_id);

-- Enable RLS
alter table public.audit_logs enable row level security;

-- Policies:
-- Only workspace members can read audit logs
drop policy if exists "members read audit_logs" on public.audit_logs;
create policy "members read audit_logs" on public.audit_logs for select using (
  exists (
    select 1 from public.workspace_members
    where workspace_members.workspace_id = audit_logs.workspace_id
    and workspace_members.user_id = auth.uid()
  )
);
