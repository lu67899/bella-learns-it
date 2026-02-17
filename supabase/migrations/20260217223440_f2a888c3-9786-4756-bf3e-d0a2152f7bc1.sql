
-- Add a column to app_features to control notification triggers
ALTER TABLE public.app_features 
ADD COLUMN notifications_enabled boolean NOT NULL DEFAULT true;

-- Update all notification triggers to check this flag

CREATE OR REPLACE FUNCTION public.notify_new_curso()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  notif_enabled boolean;
BEGIN
  SELECT COALESCE(notifications_enabled, true) INTO notif_enabled FROM public.app_features WHERE id = 1;
  IF notif_enabled THEN
    INSERT INTO public.notificacoes (tipo, titulo, mensagem, link)
    VALUES (
      'novo_conteudo',
      'Novo curso disponível!',
      'O curso "' || NEW.nome || '" foi adicionado',
      '/curso/' || NEW.id
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_new_modulo()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  curso_nome TEXT;
  notif_enabled boolean;
BEGIN
  SELECT COALESCE(notifications_enabled, true) INTO notif_enabled FROM public.app_features WHERE id = 1;
  IF notif_enabled THEN
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
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_new_topico()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  modulo_nome TEXT;
  notif_enabled boolean;
BEGIN
  SELECT COALESCE(notifications_enabled, true) INTO notif_enabled FROM public.app_features WHERE id = 1;
  IF notif_enabled THEN
    SELECT nome INTO modulo_nome FROM public.modulos WHERE id = NEW.modulo_id;
    INSERT INTO public.notificacoes (tipo, titulo, mensagem, link)
    VALUES (
      'novo_conteudo',
      'Novo tópico disponível!',
      'O tópico "' || NEW.titulo || '" foi adicionado ao módulo ' || COALESCE(modulo_nome, 'desconhecido'),
      '/modulo/' || NEW.modulo_id
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_new_video()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  cat_nome TEXT;
  notif_enabled boolean;
BEGIN
  SELECT COALESCE(notifications_enabled, true) INTO notif_enabled FROM public.app_features WHERE id = 1;
  IF notif_enabled THEN
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
  END IF;
  RETURN NEW;
END;
$function$;
