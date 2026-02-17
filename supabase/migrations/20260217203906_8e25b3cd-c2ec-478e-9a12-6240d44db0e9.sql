
-- Add total coins field to cursos
ALTER TABLE public.cursos ADD COLUMN moedas_total integer NOT NULL DEFAULT 0;

-- Update the trigger function to use course-level coins distributed proportionally
CREATE OR REPLACE FUNCTION public.award_coins_topico()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  already_completed integer;
  coin_reward integer;
  v_curso_id uuid;
  v_total_moedas integer;
  v_total_topicos integer;
BEGIN
  -- Check if already completed
  SELECT COUNT(*) INTO already_completed
  FROM public.topico_progresso
  WHERE user_id = NEW.user_id AND topico_id = NEW.topico_id AND id != NEW.id;

  IF already_completed = 0 THEN
    -- Get the curso_id via modulo
    SELECT m.curso_id INTO v_curso_id
    FROM public.modulo_topicos mt
    JOIN public.modulos m ON m.id = mt.modulo_id
    WHERE mt.id = NEW.topico_id;

    -- Check if curso has moedas_total defined
    IF v_curso_id IS NOT NULL THEN
      SELECT COALESCE(moedas_total, 0) INTO v_total_moedas
      FROM public.cursos WHERE id = v_curso_id;
    END IF;

    IF v_total_moedas > 0 THEN
      -- Count total topics in the course
      SELECT COUNT(*) INTO v_total_topicos
      FROM public.modulo_topicos mt
      JOIN public.modulos m ON m.id = mt.modulo_id
      WHERE m.curso_id = v_curso_id;

      -- Distribute proportionally (floor division)
      coin_reward := v_total_moedas / GREATEST(v_total_topicos, 1);
    ELSE
      -- Fallback to per-topic moedas
      SELECT COALESCE(moedas, 5) INTO coin_reward FROM public.modulo_topicos WHERE id = NEW.topico_id;
    END IF;

    IF coin_reward > 0 THEN
      UPDATE public.profiles SET coins = coins + coin_reward WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
