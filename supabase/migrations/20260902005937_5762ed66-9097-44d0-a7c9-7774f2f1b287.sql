-- Remove overly broad read access to predictions
DROP POLICY IF EXISTS "Users can view all predictions" ON public.bet_predictions;
DROP POLICY IF EXISTS "Users can manage their own predictions" ON public.bet_predictions;
DROP POLICY IF EXISTS "Users can delete their own predictions" ON public.bet_predictions;

REVOKE ALL ON public.bet_predictions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bet_predictions TO authenticated;
GRANT ALL ON public.bet_predictions TO service_role;

-- Read: only predictions of bets made by users in the same league (or your own)
CREATE POLICY "Users can view predictions in their league"
ON public.bet_predictions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_bets b
    JOIN public.profiles p ON p.id = b.user_id
    WHERE b.id = bet_predictions.bet_id
      AND (b.user_id = auth.uid()
           OR p.league_id = public.get_user_league_id(auth.uid()))
  )
);

-- Write: only your own predictions
CREATE POLICY "Users can insert their own predictions"
ON public.bet_predictions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_bets b WHERE b.id = bet_predictions.bet_id AND b.user_id = auth.uid())
);

CREATE POLICY "Users can update their own predictions"
ON public.bet_predictions
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_bets b WHERE b.id = bet_predictions.bet_id AND b.user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_bets b WHERE b.id = bet_predictions.bet_id AND b.user_id = auth.uid())
);

CREATE POLICY "Users can delete their own predictions"
ON public.bet_predictions
FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_bets b WHERE b.id = bet_predictions.bet_id AND b.user_id = auth.uid())
);