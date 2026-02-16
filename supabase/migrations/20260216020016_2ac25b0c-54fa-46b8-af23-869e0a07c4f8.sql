
-- Tabela de categorias de vídeo
CREATE TABLE public.video_categorias (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.video_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read video_categorias" ON public.video_categorias FOR SELECT USING (true);
CREATE POLICY "Public insert video_categorias" ON public.video_categorias FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update video_categorias" ON public.video_categorias FOR UPDATE USING (true);
CREATE POLICY "Public delete video_categorias" ON public.video_categorias FOR DELETE USING (true);

-- Adicionar categoria_id na tabela de videos
ALTER TABLE public.videos ADD COLUMN categoria_id uuid REFERENCES public.video_categorias(id) ON DELETE SET NULL;
