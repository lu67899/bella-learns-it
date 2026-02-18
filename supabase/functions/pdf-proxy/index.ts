import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return new Response("Missing id", { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabase
    .from("livros_pdf")
    .select("pdf_url, titulo")
    .eq("id", id)
    .single();

  if (error || !data) {
    return new Response("Not found", { status: 404, headers: corsHeaders });
  }

  try {
    const pdfResponse = await fetch(data.pdf_url);
    if (!pdfResponse.ok) {
      return new Response("Failed to fetch PDF", { status: 502, headers: corsHeaders });
    }

    const pdfBytes = await pdfResponse.arrayBuffer();

    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(data.titulo)}.pdf"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    return new Response("Error fetching PDF", { status: 500, headers: corsHeaders });
  }
});
