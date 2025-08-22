-- Update payer for round 1: Ori Lerner pays instead of Dan Glazer
UPDATE round_scores 
SET is_payer = false 
WHERE round_id = (SELECT id FROM toto_rounds WHERE round_number = 1) 
  AND user_id = '3e5d20e0-cbc8-480c-8e8c-bd58dcbbe3f4'; -- דן גלזר

UPDATE round_scores 
SET is_payer = true 
WHERE round_id = (SELECT id FROM toto_rounds WHERE round_number = 1) 
  AND user_id = '97a02f21-1d02-43c8-8af3-d80ddc17cb7a'; -- אורי לרנר