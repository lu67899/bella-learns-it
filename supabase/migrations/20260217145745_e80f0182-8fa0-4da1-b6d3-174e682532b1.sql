
-- Categorias de audiobooks
CREATE TABLE public.audiobook_categorias (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  icone text DEFAULT '📚',
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.audiobook_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read audiobook_categorias" ON public.audiobook_categorias FOR SELECT USING (true);
CREATE POLICY "Public insert audiobook_categorias" ON public.audiobook_categorias FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update audiobook_categorias" ON public.audiobook_categorias FOR UPDATE USING (true);
CREATE POLICY "Public delete audiobook_categorias" ON public.audiobook_categorias FOR DELETE USING (true);

-- Audiobooks
CREATE TABLE public.audiobooks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  autor text,
  descricao text,
  capa_url text,
  audio_url text NOT NULL,
  duracao_segundos integer DEFAULT 0,
  categoria_id uuid REFERENCES public.audiobook_categorias(id) ON DELETE SET NULL,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.audiobooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read audiobooks" ON public.audiobooks FOR SELECT USING (true);
CREATE POLICY "Public insert audiobooks" ON public.audiobooks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update audiobooks" ON public.audiobooks FOR UPDATE USING (true);
CREATE POLICY "Public delete audiobooks" ON public.audiobooks FOR DELETE USING (true);

-- Progresso do usuário no audiobook
CREATE TABLE public.audiobook_progresso (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  audiobook_id uuid NOT NULL REFERENCES public.audiobooks(id) ON DELETE CASCADE,
  posicao_segundos integer NOT NULL DEFAULT 0,
  concluido boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, audiobook_id)
);

ALTER TABLE public.audiobook_progresso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own audiobook_progresso" ON public.audiobook_progresso FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own audiobook_progresso" ON public.audiobook_progresso FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own audiobook_progresso" ON public.audiobook_progresso FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own audiobook_progresso" ON public.audiobook_progresso FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_audiobooks_updated_at BEFORE UPDATE ON public.audiobooks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_audiobook_progresso_updated_at BEFORE UPDATE ON public.audiobook_progresso FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
