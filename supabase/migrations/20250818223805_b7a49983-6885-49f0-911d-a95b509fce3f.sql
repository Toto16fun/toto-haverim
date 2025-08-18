-- עדכון נתונים קיימים: הפיכת המשלמים לאלו עם הכי פחות פגיעות במקום הכי הרבה
-- תחילה איפוס כל is_payer
UPDATE public.round_scores SET is_payer = false;

-- עדכון המשלמים החדשים (אלו עם הכי פחות פגיעות בכל מחזור)
WITH min_hits_per_round AS (
  SELECT round_id, MIN(hits) as min_hits
  FROM public.round_scores 
  GROUP BY round_id
)
UPDATE public.round_scores 
SET is_payer = true
FROM min_hits_per_round
WHERE round_scores.round_id = min_hits_per_round.round_id 
  AND round_scores.hits = min_hits_per_round.min_hits;