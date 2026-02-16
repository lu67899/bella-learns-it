
-- Add moedas column to modulo_topicos (coins per topic)
ALTER TABLE public.modulo_topicos ADD COLUMN moedas integer NOT NULL DEFAULT 5;

-- Add moedas column to desafios_semanais (coins per challenge)
ALTER TABLE public.desafios_semanais ADD COLUMN moedas integer NOT NULL DEFAULT 5;

-- Add moedas column to videos (coins per video watched)
ALTER TABLE public.videos ADD COLUMN moedas integer NOT NULL DEFAULT 0;

-- Update the award_coins_topico trigger function to use dynamic value
CREATE OR REPLACE FUNCTION public.award_coins_topico()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  already_completed integer;
  coin_reward integer;
BEGIN
  SELECT COUNT(*) INTO already_completed
  FROM public.topico_progresso
  WHERE user_id = NEW.user_id AND topico_id = NEW.topico_id AND id != NEW.id;

  IF already_completed = 0 THEN
    SELECT COALESCE(moedas, 5) INTO coin_reward FROM public.modulo_topicos WHERE id = NEW.topico_id;
    UPDATE public.profiles SET coins = coins + coin_reward WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Update the award_coins_desafio trigger function to use dynamic value
CREATE OR REPLACE FUNCTION public.award_coins_desafio()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  resposta_correta integer;
  coin_reward integer;
BEGIN
  SELECT correta, COALESCE(moedas, 5) INTO resposta_correta, coin_reward FROM public.desafios_semanais WHERE id = NEW.desafio_id;
  IF NEW.resposta_usuario = resposta_correta THEN
    UPDATE public.profiles SET coins = coins + coin_reward WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Create function to award coins when video is watched
CREATE OR REPLACE FUNCTION public.award_coins_video()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  already_watched integer;
  coin_reward integer;
BEGIN
  SELECT COUNT(*) INTO already_watched
  FROM public.video_assistido
  WHERE user_id = NEW.user_id AND video_id = NEW.video_id AND id != NEW.id;

  IF already_watched = 0 THEN
    SELECT COALESCE(moedas, 0) INTO coin_reward FROM public.videos WHERE id = NEW.video_id;
    IF coin_reward > 0 THEN
      UPDATE public.profiles SET coins = coins + coin_reward WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger for video coins
CREATE TRIGGER award_coins_on_video_watched
AFTER INSERT ON public.video_assistido
FOR EACH ROW
EXECUTE FUNCTION public.award_coins_video();
