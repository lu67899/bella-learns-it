import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return new Response("Missing id", { status: 400 });
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
    return new Response("Not found", { status: 404 });
  }

  // Fetch the actual PDF
  const pdfResponse = await fetch(data.pdf_url);
  if (!pdfResponse.ok) {
    return new Response("Failed to fetch PDF", { status: 502 });
  }

  const pdfBytes = await pdfResponse.arrayBuffer();

  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${encodeURIComponent(data.titulo)}.pdf"`,
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
