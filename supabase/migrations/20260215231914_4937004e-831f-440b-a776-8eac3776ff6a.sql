
CREATE TABLE public.belinha_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  texto TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.belinha_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stories are viewable by everyone" 
ON public.belinha_stories 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can manage stories" 
ON public.belinha_stories 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);
