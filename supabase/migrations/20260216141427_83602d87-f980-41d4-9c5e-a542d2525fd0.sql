
-- Table for PIX redemption requests
CREATE TABLE public.resgate_solicitacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  chave_pix TEXT NOT NULL,
  valor_moedas INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.resgate_solicitacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own resgates" ON public.resgate_solicitacoes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own resgates" ON public.resgate_solicitacoes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated update resgates" ON public.resgate_solicitacoes
  FOR UPDATE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_resgate_solicitacoes_updated_at
  BEFORE UPDATE ON public.resgate_solicitacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Notification trigger for admin
CREATE OR REPLACE FUNCTION public.notify_resgate_solicitacao()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
DECLARE
  user_name TEXT;
BEGIN
  SELECT display_name INTO user_name FROM public.profiles WHERE user_id = NEW.user_id;
  INSERT INTO public.notificacoes (tipo, titulo, mensagem, link)
  VALUES (
    'resgate',
    'Nova solicitação de resgate!',
    'O estudante "' || COALESCE(user_name, 'Desconhecido') || '" solicitou resgate de ' || NEW.valor_moedas || ' moedas. Chave PIX: ' || NEW.chave_pix,
    '/admin'
  );
  RETURN NEW;
END;
$function$;

CREATE TRIGGER notify_resgate_trigger
  AFTER INSERT ON public.resgate_solicitacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_resgate_solicitacao();
