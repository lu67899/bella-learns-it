
CREATE TABLE public.assistant_config (
  id integer NOT NULL DEFAULT 1 PRIMARY KEY,
  system_prompt text NOT NULL DEFAULT 'Você é a Belinha, uma assistente de estudos simpática e prestativa. Responda de forma clara, objetiva e amigável, sempre focada em ajudar nos estudos.',
  model text NOT NULL DEFAULT 'openai/gpt-4o-mini',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.assistant_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read assistant_config" ON public.assistant_config FOR SELECT USING (true);
CREATE POLICY "Authenticated update assistant_config" ON public.assistant_config FOR UPDATE USING (true);

INSERT INTO public.assistant_config (id) VALUES (1);

CREATE TRIGGER update_assistant_config_updated_at
  BEFORE UPDATE ON public.assistant_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
