-- Reset all tables for fresh start from round 1
-- Delete all data in the correct order to respect foreign key relationships

-- Delete bet predictions first
DELETE FROM public.bet_predictions;

-- Delete user bets
DELETE FROM public.user_bets;

-- Delete round scores
DELETE FROM public.round_scores;

-- Delete games
DELETE FROM public.games;

-- Delete all toto rounds
DELETE FROM public.toto_rounds;

-- Reset any sequences if needed (this ensures we start clean)
-- Note: UUIDs don't use sequences, so this is mainly for any bigint IDs