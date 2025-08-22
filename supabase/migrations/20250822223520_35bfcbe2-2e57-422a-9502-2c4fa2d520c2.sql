-- Update current round deadline to 13:00 Israel time (10:00 UTC in summer)
UPDATE toto_rounds 
SET deadline = '2025-08-23 10:00:00+00'::timestamptz
WHERE round_number = 3;