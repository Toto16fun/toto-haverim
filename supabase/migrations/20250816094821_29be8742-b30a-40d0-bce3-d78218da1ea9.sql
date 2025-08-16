-- Update the current round's deadline to Saturday 13:00 Israel time
-- Calculate next Saturday 13:00 Israel time (considering current DST)
-- For August 2025, Israel is in DST (UTC+3), so 13:00 IL = 10:00 UTC

UPDATE toto_rounds 
SET 
  deadline = '2025-08-16 10:00:00+00'::timestamp with time zone,
  status = 'active'
WHERE round_number = 1 AND status = 'draft';

-- Also update any locked rounds back to active if they were locked due to old deadline
UPDATE toto_rounds 
SET status = 'active'
WHERE status = 'locked' AND deadline < NOW() AND deadline > '2025-08-15 00:00:00+00';