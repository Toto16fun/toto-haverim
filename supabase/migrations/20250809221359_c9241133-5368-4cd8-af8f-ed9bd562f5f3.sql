-- Add kickoff_str column to store original time/text from image
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS kickoff_str text;

-- Add kickoff_at column to store parsed UTC time 
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS kickoff_at timestamp with time zone;