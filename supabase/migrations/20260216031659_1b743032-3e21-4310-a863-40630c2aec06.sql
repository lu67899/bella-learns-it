
-- Trigger para novos vídeos (Mix)
CREATE OR REPLACE FUNCTION public.notify_new_video()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  cat_nome TEXT;
BEGIN
  IF NEW.categoria_id IS NOT NULL THEN
    SELECT nome INTO cat_nome FROM public.video_categorias WHERE id = NEW.categoria_id;
  END IF;
  INSERT INTO public.notificacoes (tipo, titulo, mensagem, link)
  VALUES (
    'novo_conteudo',
    'Novo vídeo disponível!',
    'O vídeo "' || NEW.titulo || '" foi adicionado' || CASE WHEN cat_nome IS NOT NULL THEN ' na categoria ' || cat_nome ELSE '' END,
    '/mix/' || NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_new_video
AFTER INSERT ON public.videos
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_video();

-- Trigger para novos cursos
CREATE OR REPLACE FUNCTION public.notify_new_curso()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notificacoes (tipo, titulo, mensagem, link)
  VALUES (
    'novo_conteudo',
    'Novo curso disponível!',
    'O curso "' || NEW.nome || '" foi adicionado',
    '/curso/' || NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_new_curso
AFTER INSERT ON public.cursos
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_curso();

-- Trigger para novos módulos
CREATE OR REPLACE FUNCTION public.notify_new_modulo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  curso_nome TEXT;
BEGIN
  IF NEW.curso_id IS NOT NULL THEN
    SELECT nome INTO curso_nome FROM public.cursos WHERE id = NEW.curso_id;
  END IF;
  INSERT INTO public.notificacoes (tipo, titulo, mensagem, link)
  VALUES (
    'novo_conteudo',
    'Novo módulo disponível!',
    'O módulo "' || NEW.nome || '" foi adicionado' || CASE WHEN curso_nome IS NOT NULL THEN ' ao curso ' || curso_nome ELSE '' END,
    '/modulo/' || NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_new_modulo
AFTER INSERT ON public.modulos
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_modulo();
