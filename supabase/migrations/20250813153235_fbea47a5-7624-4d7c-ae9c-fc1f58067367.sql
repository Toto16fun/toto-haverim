-- Reset all tables again for fresh start from round 1
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