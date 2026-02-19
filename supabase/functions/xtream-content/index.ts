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

    // Action: episodes for a series
    if (action === 'episodes') {
      const seriesId = body.series_id;
      if (!seriesId) {
        return new Response(JSON.stringify({ error: 'series_id is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const res = await fetch(apiUrl(`action=get_series_info&series_id=${seriesId}`));
      if (!res.ok) throw new Error(`Xtream API error: ${res.status}`);
      const data = await res.json();

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
    const [vodCatRes, vodRes, seriesCatRes, seriesRes] = await Promise.all([
      fetch(apiUrl('action=get_vod_categories')),
      fetch(apiUrl('action=get_vod_streams')),
      fetch(apiUrl('action=get_series_categories')),
      fetch(apiUrl('action=get_series')),
    ]);

    const vodCategories = vodCatRes.ok ? await vodCatRes.json() : [];
    const vodStreams = vodRes.ok ? await vodRes.json() : [];
    const seriesCategories = seriesCatRes.ok ? await seriesCatRes.json() : [];
    const seriesStreams = seriesRes.ok ? await seriesRes.json() : [];

    // Build category map
    const catMap: Record<string, string> = {};
    for (const cat of [...(Array.isArray(vodCategories) ? vodCategories : []), ...(Array.isArray(seriesCategories) ? seriesCategories : [])]) {
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
      _series_id: s.series_id, // used for fetching episodes
    }));

    const items = [...vodItems, ...seriesItems];

    // Extract unique categories
    const categorias = [...new Set(items.map(i => i.categoria).filter(Boolean))].sort();

    // Build sessoes from categories (one per type)
    const sessoes: any[] = [];
    const filmeCats = [...new Set(vodItems.map(i => i.categoria).filter(Boolean))];
    const serieCats = [...new Set(seriesItems.map(i => i.categoria).filter(Boolean))];
    filmeCats.forEach(c => sessoes.push({ categoria: c, tipo: 'Filme' }));
    serieCats.forEach(c => sessoes.push({ categoria: c, tipo: 'Série' }));

    return new Response(JSON.stringify({ items, categorias, sessoes, plataformas: [], total: items.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
