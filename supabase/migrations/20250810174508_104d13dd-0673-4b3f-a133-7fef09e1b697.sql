-- A.1 ודא שלטבלת games יש שדה תוצאה 1/X/2
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS result text CHECK (result IN ('1','X','2'));

-- A.2 טבלת round_scores אם לא קיימת (מעדכן את הקיימת)
ALTER TABLE public.round_scores 
  DROP CONSTRAINT IF EXISTS round_scores_pkey;

ALTER TABLE public.round_scores 
  ADD CONSTRAINT round_scores_pkey PRIMARY KEY (round_id, user_id);

-- A.3 פונקציית SQL שמחשבת hits לכל משתמש במחזור (תמיכה בכפולים)
CREATE OR REPLACE FUNCTION public.compute_round_scores_sql(p_round_id uuid)
RETURNS void LANGUAGE sql AS $$
  WITH results AS (
    SELECT g.id as match_id, g.result 
    FROM public.games g
    WHERE g.round_id = p_round_id AND g.result IS NOT NULL
  ),
  user_hits AS (
    SELECT t.user_id, COUNT(DISTINCT p.match_id) as hits
    FROM public.user_bets t
    JOIN public.bet_predictions p ON p.bet_id = t.id
    JOIN results r ON r.match_id = p.game_id AND p.predictions && ARRAY[r.result]
    WHERE t.round_id = p_round_id
    GROUP BY t.user_id
  )
  INSERT INTO public.round_scores (round_id, user_id, hits)
  SELECT p_round_id, uh.user_id, uh.hits 
  FROM user_hits uh
  ON CONFLICT (round_id, user_id) 
  DO UPDATE SET hits = EXCLUDED.hits;
$$;