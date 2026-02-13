
-- Add user_id to topico_progresso
ALTER TABLE public.topico_progresso ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
UPDATE public.topico_progresso SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
ALTER TABLE public.topico_progresso ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.topico_progresso DROP CONSTRAINT IF EXISTS topico_progresso_topico_id_key;
CREATE UNIQUE INDEX topico_progresso_user_topico ON public.topico_progresso(user_id, topico_id);

-- Add user_id to anotacoes
ALTER TABLE public.anotacoes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
UPDATE public.anotacoes SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
ALTER TABLE public.anotacoes ALTER COLUMN user_id SET NOT NULL;

-- Add user_id to cronograma
ALTER TABLE public.cronograma ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
UPDATE public.cronograma SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
ALTER TABLE public.cronograma ALTER COLUMN user_id SET NOT NULL;

-- Add user_id to desafios_semanais
ALTER TABLE public.desafios_semanais ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
UPDATE public.desafios_semanais SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
ALTER TABLE public.desafios_semanais ALTER COLUMN user_id SET NOT NULL;

-- Replace RLS policies for topico_progresso
DROP POLICY IF EXISTS "Public read topico_progresso" ON public.topico_progresso;
DROP POLICY IF EXISTS "Public insert topico_progresso" ON public.topico_progresso;
DROP POLICY IF EXISTS "Public delete topico_progresso" ON public.topico_progresso;
CREATE POLICY "Users read own progresso" ON public.topico_progresso FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own progresso" ON public.topico_progresso FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own progresso" ON public.topico_progresso FOR DELETE USING (auth.uid() = user_id);

-- Replace RLS policies for anotacoes
DROP POLICY IF EXISTS "Public read anotacoes" ON public.anotacoes;
DROP POLICY IF EXISTS "Public insert anotacoes" ON public.anotacoes;
DROP POLICY IF EXISTS "Public update anotacoes" ON public.anotacoes;
DROP POLICY IF EXISTS "Public delete anotacoes" ON public.anotacoes;
CREATE POLICY "Users read own anotacoes" ON public.anotacoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own anotacoes" ON public.anotacoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own anotacoes" ON public.anotacoes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own anotacoes" ON public.anotacoes FOR DELETE USING (auth.uid() = user_id);

-- Replace RLS policies for cronograma
DROP POLICY IF EXISTS "Public read cronograma" ON public.cronograma;
DROP POLICY IF EXISTS "Public insert cronograma" ON public.cronograma;
DROP POLICY IF EXISTS "Public update cronograma" ON public.cronograma;
DROP POLICY IF EXISTS "Public delete cronograma" ON public.cronograma;
CREATE POLICY "Users read own cronograma" ON public.cronograma FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own cronograma" ON public.cronograma FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own cronograma" ON public.cronograma FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own cronograma" ON public.cronograma FOR DELETE USING (auth.uid() = user_id);

-- Replace RLS policies for desafios_semanais
DROP POLICY IF EXISTS "Public read desafios" ON public.desafios_semanais;
DROP POLICY IF EXISTS "Public insert desafios" ON public.desafios_semanais;
DROP POLICY IF EXISTS "Public update desafios" ON public.desafios_semanais;
DROP POLICY IF EXISTS "Public delete desafios" ON public.desafios_semanais;
CREATE POLICY "Users read own desafios" ON public.desafios_semanais FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own desafios" ON public.desafios_semanais FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own desafios" ON public.desafios_semanais FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own desafios" ON public.desafios_semanais FOR DELETE USING (auth.uid() = user_id);
