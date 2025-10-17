-- Delete rounds 8 and 9
-- First delete any related games
DELETE FROM public.games WHERE round_id IN (
  SELECT id FROM public.toto_rounds WHERE round_number IN (8, 9)
);

-- Then delete the rounds themselves
DELETE FROM public.toto_rounds WHERE round_number IN (8, 9);