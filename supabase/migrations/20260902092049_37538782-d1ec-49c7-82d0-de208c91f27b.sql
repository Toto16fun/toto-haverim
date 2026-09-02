CREATE TABLE public.round_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_id UUID NOT NULL REFERENCES public.toto_rounds(id) ON DELETE CASCADE,
  chat_id TEXT NOT NULL,
  summaries JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (round_id)
);
GRANT ALL ON public.round_summaries TO service_role;
ALTER TABLE public.round_summaries ENABLE ROW LEVEL SECURITY;