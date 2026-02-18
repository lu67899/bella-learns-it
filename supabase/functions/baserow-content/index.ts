import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Table IDs
const CONTEUDO_TABLE = 493857;
const CATEGORIAS_TABLE = 493863;
const EPISODIOS_TABLE = 493860;
const SESSOES_TABLE = 493869;
const PLATAFORMAS_TABLE = 493871;

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

// Field IDs for Episódios table
const EP_FIELDS = {
  Nome: 'field_3893258',      // Serie name
  Link: 'field_3893259',
  Temporada: 'field_3893260',
  Episodio: 'field_3893261',
  Historico: 'field_3893262',
  Serie: 'field_3972145',     // token/serie reference
};

// Field IDs for Sessões table
const SESSAO_FIELDS = {
  Categoria: 'field_3893378',
  Tipo: 'field_3893379',
};

// Field IDs for Plataformas table
const PLAT_FIELDS = {
  Categoria: 'field_3893388',
  Imagem: 'field_3893389',
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
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'catalog';

    // Action: get episodes for a specific serie
    if (action === 'episodes') {
      const serieName = body.serie_name;
      if (!serieName) {
        return new Response(JSON.stringify({ error: 'serie_name is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Fetch all episodes (paginated)
      let allEpisodes: any[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const res = await fetch(
          `https://api.baserow.io/api/database/rows/table/${EPISODIOS_TABLE}/?size=200&page=${page}&search=${encodeURIComponent(serieName)}`,
          { headers: authHeaders }
        );
        if (res.status !== 200) break;
        const data = await res.json();
        allEpisodes = allEpisodes.concat(data.results || []);
        hasMore = !!data.next;
        page++;
      }

      // Filter and map
      const episodes = allEpisodes
        .filter((row: any) => (row[EP_FIELDS.Nome] || '').toLowerCase() === serieName.toLowerCase())
        .map((row: any) => ({
          id: String(row.id),
          nome: row[EP_FIELDS.Nome] || '',
          link: row[EP_FIELDS.Link] || '',
          temporada: Number(row[EP_FIELDS.Temporada]) || 1,
          episodio: Number(row[EP_FIELDS.Episodio]) || 1,
          historico: row[EP_FIELDS.Historico] || '',
        }))
        .sort((a: any, b: any) => a.temporada - b.temporada || a.episodio - b.episodio);

      return new Response(JSON.stringify({ episodes }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Default action: full catalog
    const [contentRes, categoriesRes, sessoesRes, plataformasRes] = await Promise.all([
      fetch(`https://api.baserow.io/api/database/rows/table/${CONTEUDO_TABLE}/?size=200`, { headers: authHeaders }),
      fetch(`https://api.baserow.io/api/database/rows/table/${CATEGORIAS_TABLE}/?size=200`, { headers: authHeaders }),
      fetch(`https://api.baserow.io/api/database/rows/table/${SESSOES_TABLE}/?size=200`, { headers: authHeaders }),
      fetch(`https://api.baserow.io/api/database/rows/table/${PLATAFORMAS_TABLE}/?size=200`, { headers: authHeaders }),
    ]);

    if (contentRes.status !== 200) {
      const bodyText = await contentRes.text();
      return new Response(JSON.stringify({ error: 'Failed to fetch content', status: contentRes.status, body: bodyText }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const contentData = await contentRes.json();
    const categoriesData = categoriesRes.status === 200 ? await categoriesRes.json() : { results: [] };
    const sessoesData = sessoesRes.status === 200 ? await sessoesRes.json() : { results: [] };
    const plataformasData = plataformasRes.status === 200 ? await plataformasRes.json() : { results: [] };

    // Map content rows
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

    const sessoes = sessoesData.results.map((row: any) => ({
      categoria: row[SESSAO_FIELDS.Categoria] || '',
      tipo: row[SESSAO_FIELDS.Tipo] || '',
    }));

    const plataformas = plataformasData.results.map((row: any) => ({
      nome: row[PLAT_FIELDS.Categoria] || '',
      imagem: row[PLAT_FIELDS.Imagem] || '',
    }));

    return new Response(JSON.stringify({ items, categorias, sessoes, plataformas, total: contentData.count }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
