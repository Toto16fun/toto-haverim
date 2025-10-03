-- Delete empty round 7
DELETE FROM public.toto_rounds WHERE round_number = 7;

-- Update round 8 to become round 7
UPDATE public.toto_rounds 
SET round_number = 7 
WHERE round_number = 8;