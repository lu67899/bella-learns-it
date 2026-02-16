
-- Config de certificado (créditos mínimos para solicitar)
CREATE TABLE public.certificado_config (
  id integer PRIMARY KEY DEFAULT 1,
  creditos_minimos integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.certificado_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read certificado_config" ON public.certificado_config FOR SELECT USING (true);
CREATE POLICY "Authenticated update certificado_config" ON public.certificado_config FOR UPDATE USING (true);

INSERT INTO public.certificado_config (id, creditos_minimos) VALUES (1, 100);

-- Solicitações de certificado
CREATE TABLE public.certificado_solicitacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  certificado_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.certificado_solicitacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own solicitacoes" ON public.certificado_solicitacoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own solicitacoes" ON public.certificado_solicitacoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated update solicitacoes" ON public.certificado_solicitacoes FOR UPDATE USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_certificado_config_updated_at
BEFORE UPDATE ON public.certificado_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_certificado_solicitacoes_updated_at
BEFORE UPDATE ON public.certificado_solicitacoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notificar admin quando há nova solicitação
CREATE OR REPLACE FUNCTION public.notify_certificado_solicitacao()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  user_name TEXT;
BEGIN
  SELECT display_name INTO user_name FROM public.profiles WHERE user_id = NEW.user_id;
  INSERT INTO public.notificacoes (tipo, titulo, mensagem, link)
  VALUES (
    'certificado',
    'Nova solicitação de certificado!',
    'O estudante "' || COALESCE(user_name, 'Desconhecido') || '" solicitou um certificado.',
    '/admin'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_certificado_request
AFTER INSERT ON public.certificado_solicitacoes
FOR EACH ROW EXECUTE FUNCTION public.notify_certificado_solicitacao();
