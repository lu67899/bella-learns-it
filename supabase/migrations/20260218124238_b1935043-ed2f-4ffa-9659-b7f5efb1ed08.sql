
-- Tabela de livros PDF
CREATE TABLE public.livros_pdf (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  autor text,
  capa_url text,
  pdf_url text NOT NULL,
  categoria text,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.livros_pdf ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read livros_pdf" ON public.livros_pdf FOR SELECT USING (true);
CREATE POLICY "Public insert livros_pdf" ON public.livros_pdf FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update livros_pdf" ON public.livros_pdf FOR UPDATE USING (true);
CREATE POLICY "Public delete livros_pdf" ON public.livros_pdf FOR DELETE USING (true);

-- Bucket para armazenar os PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('livros-pdf', 'livros-pdf', true);

-- Policies de storage
CREATE POLICY "Public read livros-pdf" ON storage.objects FOR SELECT USING (bucket_id = 'livros-pdf');
CREATE POLICY "Authenticated upload livros-pdf" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'livros-pdf' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update livros-pdf" ON storage.objects FOR UPDATE USING (bucket_id = 'livros-pdf' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete livros-pdf" ON storage.objects FOR DELETE USING (bucket_id = 'livros-pdf' AND auth.uid() IS NOT NULL);
