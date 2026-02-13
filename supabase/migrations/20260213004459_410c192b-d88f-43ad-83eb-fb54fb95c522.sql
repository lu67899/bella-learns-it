
-- Track completed topics
CREATE TABLE public.topico_progresso (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topico_id UUID NOT NULL REFERENCES public.modulo_topicos(id) ON DELETE CASCADE,
  concluido_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(topico_id)
);

ALTER TABLE public.topico_progresso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read topico_progresso" ON public.topico_progresso FOR SELECT USING (true);
CREATE POLICY "Public insert topico_progresso" ON public.topico_progresso FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete topico_progresso" ON public.topico_progresso FOR DELETE USING (true);

-- Notifications table
CREATE TABLE public.notificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL DEFAULT 'novo_conteudo',
  titulo TEXT NOT NULL,
  mensagem TEXT,
  link TEXT,
  lida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read notificacoes" ON public.notificacoes FOR SELECT USING (true);
CREATE POLICY "Public update notificacoes" ON public.notificacoes FOR UPDATE USING (true);
CREATE POLICY "Public delete notificacoes" ON public.notificacoes FOR DELETE USING (true);
CREATE POLICY "Public insert notificacoes" ON public.notificacoes FOR INSERT WITH CHECK (true);

-- Trigger: auto-notify on new topic
CREATE OR REPLACE FUNCTION public.notify_new_topico()
RETURNS TRIGGER AS $$
DECLARE
  modulo_nome TEXT;
BEGIN
  SELECT nome INTO modulo_nome FROM public.modulos WHERE id = NEW.modulo_id;
  INSERT INTO public.notificacoes (tipo, titulo, mensagem, link)
  VALUES (
    'novo_conteudo',
    'Novo tópico disponível!',
    'O tópico "' || NEW.titulo || '" foi adicionado ao módulo ' || COALESCE(modulo_nome, 'desconhecido'),
    '/modulo/' || NEW.modulo_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER on_new_topico
AFTER INSERT ON public.modulo_topicos
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_topico();
