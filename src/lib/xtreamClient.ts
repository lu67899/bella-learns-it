import { supabase } from "@/integrations/supabase/client";

/**
 * Detects if running inside a Capacitor native app (Android/iOS).
 */
export function isNativeApp(): boolean {
  return !!(window as any).Capacitor?.isNativePlatform?.() || !!(window as any).Capacitor?.isNative;
}

interface XtreamConfig {
  xtream_url: string;
  xtream_username: string;
  xtream_password: string;
}

async function getXtreamConfig(): Promise<XtreamConfig | null> {
  const { data } = await supabase
    .from("admin_config")
    .select("xtream_url, xtream_username, xtream_password")
    .eq("id", 1)
    .single();
  if (!data?.xtream_url || !data?.xtream_username || !data?.xtream_password) return null;
  return data as XtreamConfig;
}

function apiUrl(config: XtreamConfig, params: string): string {
  const base = config.xtream_url.replace(/\/+$/, "");
  return `${base}/player_api.php?username=${encodeURIComponent(config.xtream_username)}&password=${encodeURIComponent(config.xtream_password)}&${params}`;
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Fetches full Xtream catalog directly from the server (native app only).
 */
export async function fetchXtreamCatalogDirect() {
  const config = await getXtreamConfig();
  if (!config) {
    return { error: "Xtream Codes não configurado.", items: [], categorias: [], sessoes: [], plataformas: [], total: 0 };
  }

  try {
    const [vodCategories, vodStreams, seriesCategories, seriesStreams] = await Promise.all([
      fetchJson(apiUrl(config, "action=get_vod_categories")).catch(() => []),
      fetchJson(apiUrl(config, "action=get_vod_streams")).catch(() => []),
      fetchJson(apiUrl(config, "action=get_series_categories")).catch(() => []),
      fetchJson(apiUrl(config, "action=get_series")).catch(() => []),
    ]);

    const safeArray = (v: any) => (Array.isArray(v) ? v : []);
    const vCats = safeArray(vodCategories);
    const vStreams = safeArray(vodStreams);
    const sCats = safeArray(seriesCategories);
    const sStreams = safeArray(seriesStreams);

    if (vCats.length === 0 && vStreams.length === 0 && sCats.length === 0 && sStreams.length === 0) {
      // Try auth check
      try {
        const base = config.xtream_url.replace(/\/+$/, "");
        const authData = await fetchJson(`${base}/player_api.php?username=${encodeURIComponent(config.xtream_username)}&password=${encodeURIComponent(config.xtream_password)}`);
        const status = authData?.user_info?.status;
        if (status === "Disabled" || status === "Banned") {
          return { error: `Conta Xtream desativada (${status}).`, items: [], categorias: [], sessoes: [], plataformas: [], total: 0 };
        }
        if (status === "Expired") {
          return { error: "Conta Xtream expirada.", items: [], categorias: [], sessoes: [], plataformas: [], total: 0 };
        }
      } catch {
        return { error: "Servidor Xtream inacessível.", items: [], categorias: [], sessoes: [], plataformas: [], total: 0 };
      }
    }

    // Build category map
    const catMap: Record<string, string> = {};
    for (const cat of [...vCats, ...sCats]) {
      catMap[String(cat.category_id)] = cat.category_name || "";
    }

    const base = config.xtream_url.replace(/\/+$/, "");

    const vodItems = vStreams.map((v: any) => ({
      id: `vod_${v.stream_id}`,
      titulo: v.name || "",
      capa_url: v.stream_icon || "",
      categoria: catMap[String(v.category_id)] || "Sem categoria",
      sinopse: v.plot || "",
      video_url: `${base}/movie/${encodeURIComponent(config.xtream_username)}/${encodeURIComponent(config.xtream_password)}/${v.stream_id}.${v.container_extension || "mp4"}`,
      tipo: "filme" as const,
      idioma: "",
      views: Number(v.rating) || 0,
      temporadas: 0,
    }));

    const seriesItems = sStreams.map((s: any) => ({
      id: `series_${s.series_id}`,
      titulo: s.name || "",
      capa_url: s.cover || "",
      categoria: catMap[String(s.category_id)] || "Sem categoria",
      sinopse: s.plot || "",
      video_url: "",
      tipo: "serie" as const,
      idioma: "",
      views: Number(s.rating) || 0,
      temporadas: Number(s.num) || 0,
      _series_id: s.series_id,
    }));

    const items = [...vodItems, ...seriesItems];
    const categorias = [...new Set(items.map((i) => i.categoria).filter(Boolean))].sort();

    const sessoes: any[] = [];
    const filmeCats = [...new Set(vodItems.map((i: any) => i.categoria).filter(Boolean))];
    const serieCats = [...new Set(seriesItems.map((i: any) => i.categoria).filter(Boolean))];
    filmeCats.forEach((c) => sessoes.push({ categoria: c, tipo: "Filme" }));
    serieCats.forEach((c) => sessoes.push({ categoria: c, tipo: "Série" }));

    return { items, categorias, sessoes, plataformas: [], total: items.length };
  } catch (err: any) {
    return { error: `Erro ao conectar: ${err.message}`, items: [], categorias: [], sessoes: [], plataformas: [], total: 0 };
  }
}

/**
 * Fetches episodes for a series directly (native app only).
 */
export async function fetchXtreamEpisodesDirect(seriesId: string) {
  const config = await getXtreamConfig();
  if (!config) return { episodes: [] };

  try {
    const data = await fetchJson(apiUrl(config, `action=get_series_info&series_id=${seriesId}`));
    const episodes: any[] = [];
    const episodesMap = data.episodes || {};
    const base = config.xtream_url.replace(/\/+$/, "");

    for (const [season, eps] of Object.entries(episodesMap)) {
      if (Array.isArray(eps)) {
        for (const ep of eps) {
          const ext = (ep as any).container_extension || "mp4";
          const streamUrl = `${base}/series/${encodeURIComponent(config.xtream_username)}/${encodeURIComponent(config.xtream_password)}/${(ep as any).id}.${ext}`;
          episodes.push({
            id: String((ep as any).id),
            nome: (ep as any).title || `Episódio ${(ep as any).episode_num}`,
            link: streamUrl,
            temporada: Number(season),
            episodio: Number((ep as any).episode_num) || 1,
            historico: "",
          });
        }
      }
    }

    episodes.sort((a, b) => a.temporada - b.temporada || a.episodio - b.episodio);
    return { episodes };
  } catch {
    return { episodes: [] };
  }
}
