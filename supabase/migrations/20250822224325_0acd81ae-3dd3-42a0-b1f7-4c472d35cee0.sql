-- Add manual statistics for users who didn't submit bets in round 1
INSERT INTO round_scores (round_id, user_id, hits, is_payer)
VALUES 
  ('5dea7ab5-c732-45ba-bd8a-6e046c599b1b', '21816020-bcc7-42eb-8853-15f2b5a88fac', 9, false), -- ניב עובדיה
  ('5dea7ab5-c732-45ba-bd8a-6e046c599b1b', '97a02f21-1d02-43c8-8af3-d80ddc17cb7a', 5, false); -- אורי לרנר