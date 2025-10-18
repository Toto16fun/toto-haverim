-- Update deadline for round 7 to 14:00 Israel time (11:00 UTC)
UPDATE public.toto_rounds 
SET deadline = '2025-10-04 11:00:00+00'::timestamptz
WHERE round_number = 7;