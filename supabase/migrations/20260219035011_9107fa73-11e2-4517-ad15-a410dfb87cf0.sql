
CREATE TABLE public.jogos_iframe (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  descricao text,
  icone text DEFAULT '🎮',
  iframe_url text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.jogos_iframe ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read jogos_iframe" ON public.jogos_iframe FOR SELECT USING (true);
CREATE POLICY "Public insert jogos_iframe" ON public.jogos_iframe FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update jogos_iframe" ON public.jogos_iframe FOR UPDATE USING (true);
CREATE POLICY "Public delete jogos_iframe" ON public.jogos_iframe FOR DELETE USING (true);
