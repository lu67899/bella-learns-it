
CREATE TABLE public.mensagens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  remetente text NOT NULL DEFAULT 'admin',
  conteudo text NOT NULL,
  lida boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read mensagens" ON public.mensagens FOR SELECT USING (true);
CREATE POLICY "Public insert mensagens" ON public.mensagens FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update mensagens" ON public.mensagens FOR UPDATE USING (true);
CREATE POLICY "Public delete mensagens" ON public.mensagens FOR DELETE USING (true);
