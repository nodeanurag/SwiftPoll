-- Drop the existing type constraint on polls
alter table public.polls drop constraint if exists polls_type_check;

-- Add updated check constraint to allow reactions poll type
alter table public.polls add constraint polls_type_check check (type in ('single', 'multiple', 'rating', 'scale', 'reactions'));
