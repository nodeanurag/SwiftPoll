-- Add webhook_url column to polls table
alter table public.polls add column if not exists webhook_url text;
