-- Fix RLS policies to ensure all authenticated users can access history data

-- Update profiles table policy to ensure it works for all authenticated users
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "All authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Update toto_rounds policy to be more explicit for authenticated users  
DROP POLICY IF EXISTS "Everyone can view rounds" ON public.toto_rounds;
CREATE POLICY "All authenticated users can view rounds" 
ON public.toto_rounds 
FOR SELECT 
TO authenticated
USING (true);

-- Update round_scores policy to be more explicit for authenticated users
DROP POLICY IF EXISTS "Everyone can view round scores" ON public.round_scores;  
CREATE POLICY "All authenticated users can view round scores" 
ON public.round_scores 
FOR SELECT 
TO authenticated
USING (true);