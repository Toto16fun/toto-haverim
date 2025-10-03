-- Update round 7 deadline to Saturday 13:00 Israel time (10:00 UTC)
UPDATE public.toto_rounds
SET deadline = '2025-10-04 10:00:00+00'::timestamptz
WHERE round_number = 7;