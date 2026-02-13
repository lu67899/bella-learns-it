
CREATE TABLE public.modulos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  descricao text,
  icone text DEFAULT 'BookOpen',
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.modulo_topicos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  modulo_id uuid NOT NULL REFERENCES public.modulos(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  conteudo text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulo_topicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read modulos" ON public.modulos FOR SELECT USING (true);
CREATE POLICY "Public insert modulos" ON public.modulos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update modulos" ON public.modulos FOR UPDATE USING (true);
CREATE POLICY "Public delete modulos" ON public.modulos FOR DELETE USING (true);

CREATE POLICY "Public read modulo_topicos" ON public.modulo_topicos FOR SELECT USING (true);
CREATE POLICY "Public insert modulo_topicos" ON public.modulo_topicos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update modulo_topicos" ON public.modulo_topicos FOR UPDATE USING (true);
CREATE POLICY "Public delete modulo_topicos" ON public.modulo_topicos FOR DELETE USING (true);
