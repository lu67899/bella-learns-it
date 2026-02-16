
CREATE TABLE public.memoria_pares (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  termo text NOT NULL,
  definicao text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.memoria_pares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read memoria_pares" ON public.memoria_pares FOR SELECT USING (true);
CREATE POLICY "Public insert memoria_pares" ON public.memoria_pares FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update memoria_pares" ON public.memoria_pares FOR UPDATE USING (true);
CREATE POLICY "Public delete memoria_pares" ON public.memoria_pares FOR DELETE USING (true);
