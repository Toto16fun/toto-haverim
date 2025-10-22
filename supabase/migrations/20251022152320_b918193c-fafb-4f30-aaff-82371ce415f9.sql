-- Merge "דן גלזר" data into "לאון"
-- דן גלזר ID: 3e5d20e0-cbc8-480c-8e8c-bd58dcbbe3f4
-- לאון ID: 3e2f6844-b37b-4311-93a1-afed8909b510

-- Step 1: Update all user_bets from דן גלזר to לאון
UPDATE public.user_bets
SET user_id = '3e2f6844-b37b-4311-93a1-afed8909b510'
WHERE user_id = '3e5d20e0-cbc8-480c-8e8c-bd58dcbbe3f4';

-- Step 2: Handle round_scores - merge if both users have scores in same round
-- First, for rounds where both have scores, sum the hits and keep the better rank
WITH merged_scores AS (
  SELECT 
    round_id,
    SUM(hits) as total_hits,
    MIN(rank) as best_rank,
    BOOL_OR(is_payer) as any_payer
  FROM public.round_scores
  WHERE user_id IN ('3e5d20e0-cbc8-480c-8e8c-bd58dcbbe3f4', '3e2f6844-b37b-4311-93a1-afed8909b510')
  GROUP BY round_id
  HAVING COUNT(DISTINCT user_id) = 2
)
UPDATE public.round_scores rs
SET 
  hits = ms.total_hits,
  rank = ms.best_rank,
  is_payer = ms.any_payer
FROM merged_scores ms
WHERE rs.round_id = ms.round_id
  AND rs.user_id = '3e2f6844-b37b-4311-93a1-afed8909b510';

-- Step 3: Delete דן גלזר's round_scores (either duplicates or will be moved)
DELETE FROM public.round_scores
WHERE user_id = '3e5d20e0-cbc8-480c-8e8c-bd58dcbbe3f4';

-- Step 4: Delete דן גלזר's profile
DELETE FROM public.profiles
WHERE id = '3e5d20e0-cbc8-480c-8e8c-bd58dcbbe3f4';