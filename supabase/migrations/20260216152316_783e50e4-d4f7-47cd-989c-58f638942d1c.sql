
CREATE TABLE public.forca_palavras (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  palavra text NOT NULL,
  dica text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.forca_palavras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read forca_palavras" ON public.forca_palavras FOR SELECT USING (true);
CREATE POLICY "Public insert forca_palavras" ON public.forca_palavras FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update forca_palavras" ON public.forca_palavras FOR UPDATE USING (true);
CREATE POLICY "Public delete forca_palavras" ON public.forca_palavras FOR DELETE USING (true);
