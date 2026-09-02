CREATE TABLE public.bets_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_id UUID NOT NULL REFERENCES public.toto_rounds(id) ON DELETE CASCADE UNIQUE,
  chat_id TEXT NOT NULL,
  summaries JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bets_summaries TO authenticated;
GRANT ALL ON public.bets_summaries TO service_role;
ALTER TABLE public.bets_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view bets summaries" ON public.bets_summaries FOR SELECT TO authenticated USING (true);