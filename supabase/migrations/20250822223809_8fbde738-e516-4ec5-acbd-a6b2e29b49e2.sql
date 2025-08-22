-- Delete empty round 2
DELETE FROM toto_rounds WHERE round_number = 2;

-- Update round 3 to become round 2
UPDATE toto_rounds 
SET round_number = 2 
WHERE round_number = 3;