
-- הוספת מדיניות RLS בסיסית לטבלאות שחסרות להן

-- מדיניות DELETE עבור user_bets - משתמשים יכולים למחוק רק את הטורים שלהם
CREATE POLICY "Users can delete their own bets" ON public.user_bets 
  FOR DELETE USING (auth.uid() = user_id);

-- מדיניות DELETE עבור bet_predictions - משתמשים יכולים למחוק רק את הניחושים שלהם
CREATE POLICY "Users can delete their own predictions" ON public.bet_predictions 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_bets 
      WHERE id = bet_predictions.bet_id 
      AND user_id = auth.uid()
    )
  );

-- תיקון מדיניות UPDATE עבור user_bets להוסיף WITH CHECK
DROP POLICY IF EXISTS "Users can update their own bets" ON public.user_bets;
CREATE POLICY "Users can update their own bets" ON public.user_bets 
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- הוספת מפתחות זרים בסיסיים לשמירה על שלמות הנתונים
ALTER TABLE public.games ADD CONSTRAINT fk_games_round 
  FOREIGN KEY (round_id) REFERENCES public.toto_rounds(id) ON DELETE CASCADE;

ALTER TABLE public.user_bets ADD CONSTRAINT fk_user_bets_round 
  FOREIGN KEY (round_id) REFERENCES public.toto_rounds(id) ON DELETE CASCADE;

ALTER TABLE public.bet_predictions ADD CONSTRAINT fk_bet_predictions_bet 
  FOREIGN KEY (bet_id) REFERENCES public.user_bets(id) ON DELETE CASCADE;

ALTER TABLE public.bet_predictions ADD CONSTRAINT fk_bet_predictions_game 
  FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;
