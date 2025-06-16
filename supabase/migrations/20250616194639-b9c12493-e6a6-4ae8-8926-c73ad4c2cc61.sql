
-- טבלת מחזורי טוטו
CREATE TABLE public.toto_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_number INTEGER NOT NULL,
  start_date DATE NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  results_updated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(round_number)
);

-- טבלת משחקים בכל מחזור
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_id UUID REFERENCES public.toto_rounds(id) ON DELETE CASCADE,
  game_number INTEGER NOT NULL, -- מספר המשחק במחזור (1-16)
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  actual_result TEXT CHECK (actual_result IN ('1', 'X', '2')), -- התוצאה האמיתית
  game_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(round_id, game_number)
);

-- טבלת טורים של המשתמשים
CREATE TABLE public.user_bets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  round_id UUID REFERENCES public.toto_rounds(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, round_id) -- משתמש יכול להגיש רק טור אחד למחזור
);

-- טבלת ניחושים לכל משחק
CREATE TABLE public.bet_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bet_id UUID REFERENCES public.user_bets(id) ON DELETE CASCADE,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  predictions TEXT[] NOT NULL, -- מערך של ניחושים ['1'] או ['1', 'X'] לכפול
  is_double BOOLEAN DEFAULT FALSE,
  is_correct BOOLEAN, -- האם הניחוש נכון (יחושב אוטומטי)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bet_id, game_id)
);

-- הוספת RLS policies
ALTER TABLE public.toto_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_predictions ENABLE ROW LEVEL SECURITY;

-- כולם יכולים לקרוא מחזורים ומשחקים
CREATE POLICY "Everyone can view rounds" ON public.toto_rounds FOR SELECT USING (true);
CREATE POLICY "Everyone can view games" ON public.games FOR SELECT USING (true);

-- רק אדמין יכול ליצור/לערוך מחזורים ומשחקים
CREATE POLICY "Admin can manage rounds" ON public.toto_rounds FOR ALL USING (auth.jwt() ->> 'email' = 'tomercohen1995@gmail.com');
CREATE POLICY "Admin can manage games" ON public.games FOR ALL USING (auth.jwt() ->> 'email' = 'tomercohen1995@gmail.com');

-- משתמשים יכולים לראות את הטורים שלהם ושל אחרים
CREATE POLICY "Users can view all bets" ON public.user_bets FOR SELECT USING (true);
CREATE POLICY "Users can create their own bets" ON public.user_bets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bets" ON public.user_bets FOR UPDATE USING (auth.uid() = user_id);

-- משתמשים יכולים לראות את כל הניחושים
CREATE POLICY "Users can view all predictions" ON public.bet_predictions FOR SELECT USING (true);
CREATE POLICY "Users can manage their own predictions" ON public.bet_predictions 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_bets 
      WHERE id = bet_predictions.bet_id 
      AND user_id = auth.uid()
    )
  );
