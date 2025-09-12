-- Set deadline of latest round to Saturday 13:00 Israel time (10:00 UTC)
UPDATE public.toto_rounds
SET deadline = '2025-09-13 10:00:00+00'::timestamptz
WHERE id = (
  SELECT id FROM public.toto_rounds ORDER BY round_number DESC LIMIT 1
);