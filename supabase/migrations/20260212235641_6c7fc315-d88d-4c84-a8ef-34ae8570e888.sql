
-- Resumos
CREATE TABLE public.resumos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  materia TEXT NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.resumos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read resumos" ON public.resumos FOR SELECT USING (true);
CREATE POLICY "Public insert resumos" ON public.resumos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update resumos" ON public.resumos FOR UPDATE USING (true);
CREATE POLICY "Public delete resumos" ON public.resumos FOR DELETE USING (true);

-- Flashcards
CREATE TABLE public.flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  materia TEXT NOT NULL,
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read flashcards" ON public.flashcards FOR SELECT USING (true);
CREATE POLICY "Public insert flashcards" ON public.flashcards FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update flashcards" ON public.flashcards FOR UPDATE USING (true);
CREATE POLICY "Public delete flashcards" ON public.flashcards FOR DELETE USING (true);

-- Quiz Questions
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  materia TEXT NOT NULL,
  pergunta TEXT NOT NULL,
  opcoes TEXT[] NOT NULL,
  correta INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read quiz" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "Public insert quiz" ON public.quiz_questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update quiz" ON public.quiz_questions FOR UPDATE USING (true);
CREATE POLICY "Public delete quiz" ON public.quiz_questions FOR DELETE USING (true);

-- Cronograma
CREATE TABLE public.cronograma (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  materia TEXT NOT NULL,
  dia_semana INTEGER NOT NULL,
  horario TEXT NOT NULL,
  concluida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cronograma ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read cronograma" ON public.cronograma FOR SELECT USING (true);
CREATE POLICY "Public insert cronograma" ON public.cronograma FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update cronograma" ON public.cronograma FOR UPDATE USING (true);
CREATE POLICY "Public delete cronograma" ON public.cronograma FOR DELETE USING (true);

-- Anotacoes
CREATE TABLE public.anotacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  materia TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.anotacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read anotacoes" ON public.anotacoes FOR SELECT USING (true);
CREATE POLICY "Public insert anotacoes" ON public.anotacoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update anotacoes" ON public.anotacoes FOR UPDATE USING (true);
CREATE POLICY "Public delete anotacoes" ON public.anotacoes FOR DELETE USING (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_resumos_updated_at BEFORE UPDATE ON public.resumos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_anotacoes_updated_at BEFORE UPDATE ON public.anotacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
