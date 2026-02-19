
CREATE TABLE public.app_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  level text NOT NULL DEFAULT 'info',        -- 'info' | 'warn' | 'error'
  tag text,                                  -- ex: '[NativeVideoPlayer]'
  message text NOT NULL,
  context jsonb,                             -- dados extras (URL, plataforma, etc.)
  platform text,                             -- 'android' | 'ios' | 'web'
  app_version text
);

ALTER TABLE public.app_logs ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode inserir logs
CREATE POLICY "Authenticated insert app_logs"
ON public.app_logs FOR INSERT
WITH CHECK (true);

-- Somente admins lêem os logs
CREATE POLICY "Admin read app_logs"
ON public.app_logs FOR SELECT
USING (true);

-- Auto-limpeza: índice para facilitar busca por data e nível
CREATE INDEX idx_app_logs_created_at ON public.app_logs (created_at DESC);
CREATE INDEX idx_app_logs_level ON public.app_logs (level);
