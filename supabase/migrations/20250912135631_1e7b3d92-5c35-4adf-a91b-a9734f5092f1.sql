-- Update deadline for current active round to tomorrow (Saturday 13/9/2025) at 13:00 Israel time
UPDATE public.toto_rounds 
SET deadline = '2025-09-13 10:00:00+00'::timestamptz 
WHERE status = 'active';