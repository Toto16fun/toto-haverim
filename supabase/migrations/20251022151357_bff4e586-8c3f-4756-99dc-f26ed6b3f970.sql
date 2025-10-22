-- Complete round 8 scoring: update ranks and payers, then close round

-- Step 1: Update ranks and is_payer flags
WITH ranked AS (
  SELECT 
    user_id,
    hits,
    DENSE_RANK() OVER (ORDER BY hits DESC) as new_rank
  FROM public.round_scores
  WHERE round_id = '7c4b32f7-244a-4d84-a400-8119e391012c'
),
min_hits AS (
  SELECT MIN(hits) as min_val 
  FROM public.round_scores 
  WHERE round_id = '7c4b32f7-244a-4d84-a400-8119e391012c'
)
UPDATE public.round_scores rs
SET 
  rank = r.new_rank,
  is_payer = (rs.hits = m.min_val)
FROM ranked r, min_hits m
WHERE rs.round_id = '7c4b32f7-244a-4d84-a400-8119e391012c'
  AND rs.user_id = r.user_id;

-- Step 2: Close the round
UPDATE public.toto_rounds 
SET status = 'finished' 
WHERE id = '7c4b32f7-244a-4d84-a400-8119e391012c';