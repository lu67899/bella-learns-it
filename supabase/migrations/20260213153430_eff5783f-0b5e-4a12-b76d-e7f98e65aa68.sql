
-- Criar tabela de cursos
CREATE TABLE public.cursos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  icone TEXT DEFAULT 'BookOpen',
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (admin gerencia, todos leem)
CREATE POLICY "Public read cursos" ON public.cursos FOR SELECT USING (true);
CREATE POLICY "Public insert cursos" ON public.cursos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update cursos" ON public.cursos FOR UPDATE USING (true);
CREATE POLICY "Public delete cursos" ON public.cursos FOR DELETE USING (true);

-- Adicionar coluna curso_id na tabela modulos
ALTER TABLE public.modulos ADD COLUMN curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE;

-- Criar índice para performance
CREATE INDEX idx_modulos_curso_id ON public.modulos(curso_id);
