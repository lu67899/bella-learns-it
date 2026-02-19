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

  try {
    // Get Xtream config from admin_config
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const { data: config } = await sb.from('admin_config').select('xtream_url, xtream_username, xtream_password').eq('id', 1).single();

    if (!config?.xtream_url || !config?.xtream_username || !config?.xtream_password) {
      return new Response(JSON.stringify({ error: 'Xtream Codes não configurado. Configure URL, usuário e senha no painel admin.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const baseUrl = config.xtream_url.replace(/\/+$/, '');
    const username = config.xtream_username;
    const password = config.xtream_password;

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'catalog';

    const apiUrl = (params: string) =>
      `${baseUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&${params}`;

    // First, validate credentials by checking auth
    const authCheckUrl = `${baseUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    console.log('Xtream auth check URL:', authCheckUrl.replace(password, '***'));

    // Action: episodes for a series
    if (action === 'episodes') {
      const seriesId = body.series_id;
      if (!seriesId) {
        return new Response(JSON.stringify({ error: 'series_id is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const url = apiUrl(`action=get_series_info&series_id=${seriesId}`);
      console.log('Fetching series info for:', seriesId);
      const res = await fetch(url);
      const resText = await res.text();
      console.log('Series info response status:', res.status, 'length:', resText.length);

      if (!res.ok) {
        return new Response(JSON.stringify({ error: `Xtream API error: ${res.status}`, detail: resText.slice(0, 200) }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      let data;
      try {
        data = JSON.parse(resText);
      } catch {
        return new Response(JSON.stringify({ error: 'Resposta inválida do servidor Xtream', detail: resText.slice(0, 200) }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const episodes: any[] = [];
      const episodesMap = data.episodes || {};
      for (const [season, eps] of Object.entries(episodesMap)) {
        if (Array.isArray(eps)) {
          for (const ep of eps) {
            const ext = ep.container_extension || 'mp4';
            const streamUrl = `${baseUrl}/series/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${ep.id}.${ext}`;
            episodes.push({
              id: String(ep.id),
              nome: ep.title || `Episódio ${ep.episode_num}`,
              link: streamUrl,
              temporada: Number(season),
              episodio: Number(ep.episode_num) || 1,
              historico: '',
            });
          }
        }
      }

      episodes.sort((a, b) => a.temporada - b.temporada || a.episodio - b.episodio);

      return new Response(JSON.stringify({ episodes }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Default: full catalog
    console.log('Fetching full catalog from Xtream...');
    const urls = [
      { name: 'vod_categories', url: apiUrl('action=get_vod_categories') },
      { name: 'vod_streams', url: apiUrl('action=get_vod_streams') },
      { name: 'series_categories', url: apiUrl('action=get_series_categories') },
      { name: 'series', url: apiUrl('action=get_series') },
    ];

    const results = await Promise.all(urls.map(async ({ name, url }) => {
      try {
        console.log(`Fetching ${name}...`);
        const res = await fetch(url);
        const text = await res.text();
        console.log(`${name}: status=${res.status}, length=${text.length}, preview=${text.slice(0, 100)}`);
        
        if (!res.ok) {
          console.error(`${name} failed with status ${res.status}`);
          return [];
        }

        try {
          const parsed = JSON.parse(text);
          if (!Array.isArray(parsed)) {
            console.error(`${name} returned non-array:`, typeof parsed, Object.keys(parsed || {}).slice(0, 5));
            // Check if it's an auth error object
            if (parsed && parsed.user_info === undefined && parsed.server_info === undefined) {
              return Array.isArray(parsed) ? parsed : [];
            }
            return [];
          }
          return parsed;
        } catch {
          console.error(`${name} JSON parse failed, text preview:`, text.slice(0, 200));
          return [];
        }
      } catch (err) {
        console.error(`${name} fetch error:`, err.message);
        return [];
      }
    }));

    const [vodCategories, vodStreams, seriesCategories, seriesStreams] = results;

    console.log(`Results: vodCats=${vodCategories.length}, vod=${vodStreams.length}, seriesCats=${seriesCategories.length}, series=${seriesStreams.length}`);

    // If everything is empty, likely an auth issue
    if (vodCategories.length === 0 && vodStreams.length === 0 && seriesCategories.length === 0 && seriesStreams.length === 0) {
      // Try auth check
      try {
        const authRes = await fetch(authCheckUrl);
        const authText = await authRes.text();
        console.log('Auth check response:', authText.slice(0, 300));
        
        let authData;
        try { authData = JSON.parse(authText); } catch { authData = null; }
        
        if (authData && authData.user_info) {
          const status = authData.user_info.status;
          if (status === 'Disabled' || status === 'Banned') {
            return new Response(JSON.stringify({ 
              error: `Conta Xtream desativada (${status}). Verifique suas credenciais.`,
              items: [], categorias: [], sessoes: [], plataformas: [], total: 0 
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          if (status === 'Expired') {
            return new Response(JSON.stringify({ 
              error: 'Conta Xtream expirada. Renove sua assinatura.',
              items: [], categorias: [], sessoes: [], plataformas: [], total: 0 
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        } else {
          return new Response(JSON.stringify({ 
            error: 'Falha ao conectar ao servidor Xtream. Verifique a URL e credenciais.',
            items: [], categorias: [], sessoes: [], plataformas: [], total: 0 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (authErr) {
        return new Response(JSON.stringify({ 
          error: `Servidor Xtream inacessível: ${authErr.message}`,
          items: [], categorias: [], sessoes: [], plataformas: [], total: 0 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Build category map
    const catMap: Record<string, string> = {};
    for (const cat of [...vodCategories, ...seriesCategories]) {
      catMap[String(cat.category_id)] = cat.category_name || '';
    }

    // Map VOD streams to ContentItem format
    const vodItems = (Array.isArray(vodStreams) ? vodStreams : []).map((v: any) => ({
      id: `vod_${v.stream_id}`,
      titulo: v.name || '',
      capa_url: v.stream_icon || '',
      categoria: catMap[String(v.category_id)] || 'Sem categoria',
      sinopse: v.plot || '',
      video_url: `${baseUrl}/movie/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${v.stream_id}.${v.container_extension || 'mp4'}`,
      tipo: 'filme',
      idioma: '',
      views: Number(v.rating) || 0,
      temporadas: 0,
    }));

    // Map series to ContentItem format
    const seriesItems = (Array.isArray(seriesStreams) ? seriesStreams : []).map((s: any) => ({
      id: `series_${s.series_id}`,
      titulo: s.name || '',
      capa_url: s.cover || '',
      categoria: catMap[String(s.category_id)] || 'Sem categoria',
      sinopse: s.plot || '',
      video_url: '',
      tipo: 'serie',
      idioma: '',
      views: Number(s.rating) || 0,
      temporadas: Number(s.num) || 0,
      _series_id: s.series_id,
    }));

    const items = [...vodItems, ...seriesItems];

    // Extract unique categories from items (auto from server)
    const categorias = [...new Set(items.map(i => i.categoria).filter(Boolean))].sort();

    // Build sessoes from categories (one per type)
    const sessoes: any[] = [];
    const filmeCats = [...new Set(vodItems.map(i => i.categoria).filter(Boolean))];
    const serieCats = [...new Set(seriesItems.map(i => i.categoria).filter(Boolean))];
    filmeCats.forEach(c => sessoes.push({ categoria: c, tipo: 'Filme' }));
    serieCats.forEach(c => sessoes.push({ categoria: c, tipo: 'Série' }));

    console.log(`Final: ${items.length} items, ${categorias.length} categories, ${sessoes.length} sessions`);

    return new Response(JSON.stringify({ items, categorias, sessoes, plataformas: [], total: items.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Xtream content error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
