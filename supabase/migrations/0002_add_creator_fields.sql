-- Migration: Add user_id and creator_ip_hash to polls table to track creation limits
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS creator_ip_hash text;

-- Create indexes for performance on daily count queries
CREATE INDEX IF NOT EXISTS idx_polls_user_id ON public.polls(user_id);
CREATE INDEX IF NOT EXISTS idx_polls_creator_ip_hash ON public.polls(creator_ip_hash);
