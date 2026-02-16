
-- Add coins column to profiles
ALTER TABLE public.profiles ADD COLUMN coins integer NOT NULL DEFAULT 0;

-- Award 5 coins when a topic is completed
CREATE OR REPLACE FUNCTION public.award_coins_topico()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.profiles SET coins = coins + 5 WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_award_coins_topico
AFTER INSERT ON public.topico_progresso
FOR EACH ROW EXECUTE FUNCTION public.award_coins_topico();

-- Award 5 coins when a challenge is answered correctly
CREATE OR REPLACE FUNCTION public.award_coins_desafio()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  resposta_correta integer;
BEGIN
  SELECT correta INTO resposta_correta FROM public.desafios_semanais WHERE id = NEW.desafio_id;
  IF NEW.resposta_usuario = resposta_correta THEN
    UPDATE public.profiles SET coins = coins + 5 WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_award_coins_desafio
AFTER INSERT ON public.desafio_respostas
FOR EACH ROW EXECUTE FUNCTION public.award_coins_desafio();
