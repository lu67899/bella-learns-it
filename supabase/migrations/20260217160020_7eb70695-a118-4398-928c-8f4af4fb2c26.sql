
-- Create chapters table for audiobooks
CREATE TABLE public.audiobook_capitulos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audiobook_id UUID NOT NULL REFERENCES public.audiobooks(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  audio_url TEXT NOT NULL,
  duracao_segundos INTEGER DEFAULT 0,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audiobook_capitulos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read audiobook_capitulos" ON public.audiobook_capitulos FOR SELECT USING (true);
CREATE POLICY "Public insert audiobook_capitulos" ON public.audiobook_capitulos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update audiobook_capitulos" ON public.audiobook_capitulos FOR UPDATE USING (true);
CREATE POLICY "Public delete audiobook_capitulos" ON public.audiobook_capitulos FOR DELETE USING (true);

-- Add capitulo_id to progress tracking (nullable for backward compat)
ALTER TABLE public.audiobook_progresso ADD COLUMN capitulo_id UUID REFERENCES public.audiobook_capitulos(id) ON DELETE CASCADE;

-- Drop old unique constraint and add new one
ALTER TABLE public.audiobook_progresso DROP CONSTRAINT IF EXISTS audiobook_progresso_user_id_audiobook_id_key;
CREATE UNIQUE INDEX audiobook_progresso_user_capitulo_idx ON public.audiobook_progresso (user_id, audiobook_id, capitulo_id);
