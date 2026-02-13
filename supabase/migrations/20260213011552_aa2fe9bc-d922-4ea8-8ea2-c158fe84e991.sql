
-- Tabela de desafios semanais (perguntas que o admin define)
CREATE TABLE public.desafios_semanais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pergunta TEXT NOT NULL,
  opcoes TEXT[] NOT NULL,
  correta INTEGER NOT NULL,
  respondida BOOLEAN NOT NULL DEFAULT false,
  resposta_usuario INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.desafios_semanais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read desafios" ON public.desafios_semanais FOR SELECT USING (true);
CREATE POLICY "Public insert desafios" ON public.desafios_semanais FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update desafios" ON public.desafios_semanais FOR UPDATE USING (true);
CREATE POLICY "Public delete desafios" ON public.desafios_semanais FOR DELETE USING (true);
