-- Create leagues table
CREATE TABLE public.leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  join_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create league_admins table
CREATE TABLE public.league_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(league_id, user_id)
);

-- Add league_id to profiles
ALTER TABLE public.profiles 
ADD COLUMN league_id UUID REFERENCES public.leagues(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_profiles_league_id ON public.profiles(league_id);
CREATE INDEX idx_league_admins_user_id ON public.league_admins(user_id);
CREATE INDEX idx_league_admins_league_id ON public.league_admins(league_id);

-- Create function to get user's league_id
CREATE OR REPLACE FUNCTION public.get_user_league_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT league_id FROM public.profiles WHERE id = _user_id;
$$;

-- Create function to check if user is league admin
CREATE OR REPLACE FUNCTION public.is_league_admin(_user_id UUID, _league_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.league_admins 
    WHERE user_id = _user_id AND league_id = _league_id
  );
$$;

-- Enable RLS on new tables
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leagues table
CREATE POLICY "Users can view their own league"
  ON public.leagues FOR SELECT
  USING (id = public.get_user_league_id(auth.uid()));

CREATE POLICY "Super admin can manage all leagues"
  ON public.leagues FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for league_admins table
CREATE POLICY "Users can view admins in their league"
  ON public.league_admins FOR SELECT
  USING (league_id = public.get_user_league_id(auth.uid()));

CREATE POLICY "League admins can manage admins in their league"
  ON public.league_admins FOR ALL
  USING (public.is_league_admin(auth.uid(), league_id));

CREATE POLICY "Super admin can manage all league admins"
  ON public.league_admins FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Update RLS policies for profiles to filter by league
DROP POLICY IF EXISTS "All authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Users can view profiles in their league"
  ON public.profiles FOR SELECT
  USING (
    league_id = public.get_user_league_id(auth.uid()) 
    OR auth.uid() = id
  );

-- Update RLS policies for round_scores to filter by league
DROP POLICY IF EXISTS "All authenticated users can view round scores" ON public.round_scores;
CREATE POLICY "Users can view scores in their league"
  ON public.round_scores FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.profiles 
      WHERE league_id = public.get_user_league_id(auth.uid())
    )
  );

-- Update RLS policies for user_bets to filter by league
DROP POLICY IF EXISTS "Users can view all bets" ON public.user_bets;
CREATE POLICY "Users can view bets in their league"
  ON public.user_bets FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.profiles 
      WHERE league_id = public.get_user_league_id(auth.uid())
    )
  );

-- Insert the main league
INSERT INTO public.leagues (name, join_code) 
VALUES ('ליגת הבית', 'MAIN2025');

-- Assign all existing users to the main league
UPDATE public.profiles 
SET league_id = (SELECT id FROM public.leagues WHERE join_code = 'MAIN2025')
WHERE league_id IS NULL;