
CREATE TABLE public.ordenar_passos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  passos text[] NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ordenar_passos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read ordenar_passos" ON public.ordenar_passos FOR SELECT USING (true);
CREATE POLICY "Public insert ordenar_passos" ON public.ordenar_passos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update ordenar_passos" ON public.ordenar_passos FOR UPDATE USING (true);
CREATE POLICY "Public delete ordenar_passos" ON public.ordenar_passos FOR DELETE USING (true);
