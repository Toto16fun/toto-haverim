-- Add unique constraint for round_scores table
ALTER TABLE public.round_scores 
ADD CONSTRAINT unique_round_user UNIQUE (round_id, user_id);