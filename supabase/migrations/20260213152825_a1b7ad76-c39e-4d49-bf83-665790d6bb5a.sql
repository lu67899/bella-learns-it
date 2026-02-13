
CREATE TABLE public.materias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.materias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read materias" ON public.materias FOR SELECT USING (true);
CREATE POLICY "Public insert materias" ON public.materias FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update materias" ON public.materias FOR UPDATE USING (true);
CREATE POLICY "Public delete materias" ON public.materias FOR DELETE USING (true);

-- Seed with a few basics from the old list
INSERT INTO public.materias (nome) VALUES
  ('Programação'),
  ('Banco de Dados'),
  ('Redes de Computadores'),
  ('Engenharia de Software'),
  ('Estrutura de Dados'),
  ('Sistemas Operacionais');
