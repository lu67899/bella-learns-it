import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CONTEUDO_TABLE = 493857;
const CATEGORIAS_TABLE = 493863;

// Field IDs for Conteúdo table
const FIELDS = {
  Nome: 'field_3893232',
  Capa: 'field_3893233',
  Categoria: 'field_3893234',
  Sinopse: 'field_3893235',
  Link: 'field_3893236',
  Tipo: 'field_3893237',
  Idioma: 'field_3893238',
  Views: 'field_3893239',
  Temporadas: 'field_3893240',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const token = Deno.env.get('BASEROW_API_TOKEN');
  if (!token) {
    return new Response(JSON.stringify({ error: 'BASEROW_API_TOKEN not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const authHeaders = { 'Authorization': `Token ${token}` };

    // Fetch all content (paginated, up to 200)
    const [contentRes, categoriesRes] = await Promise.all([
      fetch(`https://api.baserow.io/api/database/rows/table/${CONTEUDO_TABLE}/?size=200`, { headers: authHeaders }),
      fetch(`https://api.baserow.io/api/database/rows/table/${CATEGORIAS_TABLE}/?size=200`, { headers: authHeaders }),
    ]);

    if (contentRes.status !== 200) {
      const body = await contentRes.text();
      return new Response(JSON.stringify({ error: 'Failed to fetch content', status: contentRes.status, body }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const contentData = await contentRes.json();
    const categoriesData = categoriesRes.status === 200 ? await categoriesRes.json() : { results: [] };

    // Map rows to clean objects
    const items = contentData.results.map((row: any) => ({
      id: String(row.id),
      titulo: row[FIELDS.Nome] || '',
      capa_url: row[FIELDS.Capa] || '',
      categoria: row[FIELDS.Categoria] || '',
      sinopse: row[FIELDS.Sinopse] || '',
      video_url: row[FIELDS.Link] || '',
      tipo: (row[FIELDS.Tipo] || '').toLowerCase() === 'série' || (row[FIELDS.Tipo] || '').toLowerCase() === 'serie' ? 'serie' : 'filme',
      idioma: row[FIELDS.Idioma] || '',
      views: Number(row[FIELDS.Views]) || 0,
      temporadas: Number(row[FIELDS.Temporadas]) || 0,
    }));

    const categorias = categoriesData.results.map((row: any) => row.field_3893271 || '');

    return new Response(JSON.stringify({ items, categorias, total: contentData.count }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
