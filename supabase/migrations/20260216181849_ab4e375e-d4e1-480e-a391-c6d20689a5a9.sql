
CREATE TABLE public.cruzadas_palavras (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  palavra text NOT NULL,
  dica text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cruzadas_palavras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read cruzadas_palavras" ON public.cruzadas_palavras FOR SELECT USING (true);
CREATE POLICY "Public insert cruzadas_palavras" ON public.cruzadas_palavras FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update cruzadas_palavras" ON public.cruzadas_palavras FOR UPDATE USING (true);
CREATE POLICY "Public delete cruzadas_palavras" ON public.cruzadas_palavras FOR DELETE USING (true);
