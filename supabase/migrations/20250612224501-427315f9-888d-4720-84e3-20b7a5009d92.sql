
-- Modify rewards table to remove points_required and add it to reward_items
ALTER TABLE public.rewards DROP COLUMN IF EXISTS points_required;

-- Add points_required column to reward_items table
ALTER TABLE public.reward_items ADD COLUMN IF NOT EXISTS points_required INTEGER NOT NULL DEFAULT 100;
