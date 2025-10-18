-- Set round 8 deadline to Oct 18, 2025 14:00 Israel time (11:00 UTC)
UPDATE public.toto_rounds 
SET deadline = '2025-10-18 11:00:00+00'::timestamptz
WHERE id = '7c4b32f7-244a-4d84-a400-8119e391012c';