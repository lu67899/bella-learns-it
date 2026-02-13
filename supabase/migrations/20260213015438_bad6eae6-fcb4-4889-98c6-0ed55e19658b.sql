
CREATE TABLE public.frases_motivacionais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  texto TEXT NOT NULL,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.frases_motivacionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read frases" ON public.frases_motivacionais FOR SELECT USING (true);
CREATE POLICY "Public insert frases" ON public.frases_motivacionais FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update frases" ON public.frases_motivacionais FOR UPDATE USING (true);
CREATE POLICY "Public delete frases" ON public.frases_motivacionais FOR DELETE USING (true);

-- Inserir algumas frases iniciais
INSERT INTO public.frases_motivacionais (texto) VALUES
  ('A persistência é o caminho do êxito. 🚀'),
  ('Estudar é investir em si mesma. 💜'),
  ('Cada dia é uma nova chance de aprender algo incrível. ✨'),
  ('Você é mais forte do que imagina! 💪');
