
CREATE OR REPLACE FUNCTION public.award_coins_topico()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  already_completed integer;
BEGIN
  -- Check if user already completed this topic before (prevent duplicate coin awards)
  SELECT COUNT(*) INTO already_completed
  FROM public.topico_progresso
  WHERE user_id = NEW.user_id AND topico_id = NEW.topico_id AND id != NEW.id;

  -- Only award coins if this is the first time completing this topic
  IF already_completed = 0 THEN
    UPDATE public.profiles SET coins = coins + 5 WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;
