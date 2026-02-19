import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action, url: serverUrl, username, password, category_id, page = 1, limit = 48 } = body;

    if (!serverUrl || !username || !password) {
      return new Response(JSON.stringify({ error: 'url, username and password are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Normalize base URL
    const base = serverUrl.replace(/\/$/, '');
    const auth = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

    // ── Action: categories ──────────────────────────────────────────
    if (action === 'categories') {
      const [vodCats, seriesCats] = await Promise.all([
        fetch(`${base}/player_api.php?${auth}&action=get_vod_categories`).then(r => r.json()).catch(() => []),
        fetch(`${base}/player_api.php?${auth}&action=get_series_categories`).then(r => r.json()).catch(() => []),
      ]);

      const categories = [
        ...(Array.isArray(vodCats) ? vodCats.map((c: any) => ({ id: c.category_id, nome: c.category_name, tipo: 'filme' })) : []),
        ...(Array.isArray(seriesCats) ? seriesCats.map((c: any) => ({ id: c.category_id, nome: c.category_name, tipo: 'serie' })) : []),
      ];

      return new Response(JSON.stringify({ categories }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ── Action: vod (paginated) ──────────────────────────────────────
    if (action === 'vod') {
      let apiUrl = `${base}/player_api.php?${auth}&action=get_vod_streams`;
      if (category_id) apiUrl += `&category_id=${category_id}`;

      const data = await fetch(apiUrl).then(r => r.json()).catch(() => []);
      const all = Array.isArray(data) ? data : [];

      // Paginate
      const start = (page - 1) * limit;
      const slice = all.slice(start, start + limit);

      const items = slice.map((s: any) => ({
        id: String(s.stream_id || s.num),
        titulo: s.name || '',
        capa_url: s.stream_icon || '',
        sinopse: s.plot || '',
        categoria: s.category_name || s.category_id || '',
        categoria_id: String(s.category_id || ''),
        video_url: `${base}/movie/${username}/${password}/${s.stream_id}.${s.container_extension || 'mp4'}`,
        tipo: 'filme' as const,
        idioma: s.stream_type || '',
        views: Number(s.rating || 0),
        temporadas: 0,
        stream_id: String(s.stream_id),
      }));

      return new Response(JSON.stringify({ items, total: all.length, page, has_more: start + limit < all.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ── Action: series (paginated) ──────────────────────────────────
    if (action === 'series') {
      let apiUrl = `${base}/player_api.php?${auth}&action=get_series`;
      if (category_id) apiUrl += `&category_id=${category_id}`;

      const data = await fetch(apiUrl).then(r => r.json()).catch(() => []);
      const all = Array.isArray(data) ? data : [];

      // Paginate
      const start = (page - 1) * limit;
      const slice = all.slice(start, start + limit);

      const items = slice.map((s: any) => ({
        id: String(s.series_id),
        titulo: s.name || '',
        capa_url: s.cover || '',
        sinopse: s.plot || '',
        categoria: s.category_name || s.category_id || '',
        categoria_id: String(s.category_id || ''),
        video_url: '',
        tipo: 'serie' as const,
        idioma: '',
        views: Number(s.rating || 0),
        temporadas: 0,
        series_id: String(s.series_id),
      }));

      return new Response(JSON.stringify({ items, total: all.length, page, has_more: start + limit < all.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ── Action: series_episodes ──────────────────────────────────────
    if (action === 'series_episodes') {
      const { series_id } = body;
      if (!series_id) {
        return new Response(JSON.stringify({ error: 'series_id required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const data = await fetch(`${base}/player_api.php?${auth}&action=get_series_info&series_id=${series_id}`)
        .then(r => r.json()).catch(() => ({}));

      const episodes: any[] = [];
      const seasonsObj = data.episodes || {};

      Object.entries(seasonsObj).forEach(([season, eps]: [string, any]) => {
        if (Array.isArray(eps)) {
          eps.forEach((ep: any) => {
            episodes.push({
              id: String(ep.id),
              nome: ep.title || ep.episode_num,
              link: `${base}/series/${username}/${password}/${ep.id}.${ep.container_extension || 'mkv'}`,
              temporada: Number(season),
              episodio: Number(ep.episode_num),
              historico: '',
            });
          });
        }
      });

      episodes.sort((a, b) => a.temporada - b.temporada || a.episodio - b.episodio);

      return new Response(JSON.stringify({ episodes }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
