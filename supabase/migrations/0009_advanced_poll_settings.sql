-- Drop the existing type constraint on polls
alter table public.polls drop constraint if exists polls_type_check;

-- Add updated check constraint to allow ranking and text poll types
alter table public.polls add constraint polls_type_check check (type in ('single', 'multiple', 'rating', 'scale', 'reactions', 'ranking', 'text'));

-- Add image_url to poll_options
alter table public.poll_options add column if not exists image_url text;

-- Add advanced configurations to polls
alter table public.polls add column if not exists hide_results_until_close boolean not null default false;
alter table public.polls add column if not exists vote_limit integer;
alter table public.polls add column if not exists password_hash text;

-- Add rank and text_response to votes
alter table public.votes add column if not exists rank integer;
alter table public.votes add column if not exists text_response text;
