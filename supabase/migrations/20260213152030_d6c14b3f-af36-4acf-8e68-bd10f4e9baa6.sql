
-- Drop user-specific RLS policies first
DROP POLICY IF EXISTS "Users read own desafios" ON public.desafios_semanais;
DROP POLICY IF EXISTS "Users insert own desafios" ON public.desafios_semanais;
DROP POLICY IF EXISTS "Users update own desafios" ON public.desafios_semanais;
DROP POLICY IF EXISTS "Users delete own desafios" ON public.desafios_semanais;

-- Now drop user_id column
ALTER TABLE public.desafios_semanais DROP COLUMN user_id;

-- Re-create public policies
CREATE POLICY "Public read desafios" ON public.desafios_semanais FOR SELECT USING (true);
CREATE POLICY "Public insert desafios" ON public.desafios_semanais FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update desafios" ON public.desafios_semanais FOR UPDATE USING (true);
CREATE POLICY "Public delete desafios" ON public.desafios_semanais FOR DELETE USING (true);

-- Remove per-user response columns from desafios_semanais
ALTER TABLE public.desafios_semanais DROP COLUMN IF EXISTS respondida;
ALTER TABLE public.desafios_semanais DROP COLUMN IF EXISTS resposta_usuario;

-- Create per-user response tracking table
CREATE TABLE public.desafio_respostas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  desafio_id UUID NOT NULL REFERENCES public.desafios_semanais(id) ON DELETE CASCADE,
  resposta_usuario INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, desafio_id)
);

ALTER TABLE public.desafio_respostas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own respostas" ON public.desafio_respostas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own respostas" ON public.desafio_respostas FOR INSERT WITH CHECK (auth.uid() = user_id);
