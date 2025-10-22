-- Recompute round scores for all rounds based on current bets (after user merge)
SELECT public.compute_round_scores_sql(id)
FROM public.toto_rounds;

-- Recalculate rank and payer flags per round
WITH ranked AS (
  SELECT 
    id AS score_id,
    round_id,
    hits,
    DENSE_RANK() OVER (PARTITION BY round_id ORDER BY hits DESC) AS rnk,
    MIN(hits) OVER (PARTITION BY round_id) AS min_hits
  FROM public.round_scores
)
UPDATE public.round_scores rs
SET 
  rank = r.rnk,
  is_payer = (rs.hits = r.min_hits)
FROM ranked r
WHERE rs.id = r.score_id;