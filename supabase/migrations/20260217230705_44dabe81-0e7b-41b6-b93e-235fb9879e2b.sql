
-- Tabela segura para chaves de API (somente admin pode ler/editar)
CREATE TABLE public.api_keys_config (
  id integer NOT NULL DEFAULT 1 PRIMARY KEY,
  openrouter_api_key text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Inserir registro padrão
INSERT INTO public.api_keys_config (id, openrouter_api_key) VALUES (1, '');

-- Enable RLS
ALTER TABLE public.api_keys_config ENABLE ROW LEVEL SECURITY;

-- Somente admins podem ler
CREATE POLICY "Admin read api_keys_config"
ON public.api_keys_config
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Somente admins podem atualizar
CREATE POLICY "Admin update api_keys_config"
ON public.api_keys_config
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE TRIGGER update_api_keys_config_updated_at
BEFORE UPDATE ON public.api_keys_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
