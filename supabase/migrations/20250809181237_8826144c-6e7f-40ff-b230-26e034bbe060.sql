-- Add missing tables for round scores and statistics
CREATE TABLE public.round_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_id uuid NOT NULL,
  user_id uuid NOT NULL,
  hits integer NOT NULL DEFAULT 0,
  is_payer boolean NOT NULL DEFAULT false,
  rank integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.round_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for round_scores
CREATE POLICY "Everyone can view round scores" 
ON public.round_scores 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can manage round scores" 
ON public.round_scores 
FOR ALL 
USING ((auth.jwt() ->> 'email'::text) = 'tomercohen1995@gmail.com'::text);

-- Add indexes for better performance
CREATE INDEX idx_round_scores_round_id ON public.round_scores(round_id);
CREATE INDEX idx_round_scores_user_id ON public.round_scores(user_id);
CREATE INDEX idx_round_scores_rank ON public.round_scores(round_id, rank);

-- Add status column to toto_rounds if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='toto_rounds' AND column_name='status') THEN
    ALTER TABLE public.toto_rounds ADD COLUMN status text DEFAULT 'active';
  END IF;
END $$;

-- Add is_autofilled column to user_bets if it doesn't exist  
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='user_bets' AND column_name='is_autofilled') THEN
    ALTER TABLE public.user_bets ADD COLUMN is_autofilled boolean DEFAULT false;
  END IF;
END $$;