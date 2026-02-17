
-- Add subject and estimated time to cursos
ALTER TABLE public.cursos ADD COLUMN assunto text DEFAULT NULL;
ALTER TABLE public.cursos ADD COLUMN tempo_estimado text DEFAULT NULL;

-- Create enrollment table
CREATE TABLE public.inscricoes_cursos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  curso_id uuid NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, curso_id)
);

ALTER TABLE public.inscricoes_cursos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own inscricoes" ON public.inscricoes_cursos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own inscricoes" ON public.inscricoes_cursos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own inscricoes" ON public.inscricoes_cursos FOR DELETE USING (auth.uid() = user_id);
