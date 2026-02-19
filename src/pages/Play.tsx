import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Layout } from "@/components/Layout";
import BackButton from "@/components/BackButton";
import { Play as PlayIcon, Star, Search, X, Film, Tv, Loader2, ChevronDown, List, ChevronLeft, ChevronRight, Server } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";

// ── Types ──
interface ContentItem {
  id: string;
  titulo: string;
  sinopse: string;
  capa_url: string;
  video_url: string;
  tipo: "filme" | "serie";
  categoria: string;
  categoria_id?: string;
  idioma: string;
  views: number;
  temporadas: number;
  stream_id?: string;
  series_id?: string;
}

interface XtreamConfig {
  url: string;
  username: string;
  password: string;
}

interface Episode {
  id: string;
  nome: string;
  link: string;
  temporada: number;
  episodio: number;
  historico: string;
}

interface XtreamCategory {
  id: string;
  nome: string;
  tipo: "filme" | "serie";
}

const TIPOS = [
  { value: "todos", label: "Tudo", icon: null },
  { value: "filme", label: "Filmes", icon: Film },
  { value: "serie", label: "Séries", icon: Tv },
];

const PAGE_SIZE = 48;

// ── Helpers ──
function ViewsBadge({ views }: { views: number }) {
  if (!views) return null;
  return (
    <div className="flex items-center gap-1">
      <Star className="h-3 w-3 fill-primary text-primary" />
      <span className="text-xs font-mono text-primary">{views.toFixed(1)}</span>
    </div>
  );
}

// ── Content Card ──
function ContentCard({ item, onClick }: { item: ContentItem; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="group relative flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] text-left focus:outline-none"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden ring-1 ring-border/30 group-hover:ring-primary/50 transition-all duration-300">
        {item.capa_url ? (
          <img
            src={item.capa_url}
            alt={item.titulo}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-muted/30 flex items-center justify-center">
            {item.tipo === "serie" ? <Tv className="h-8 w-8 text-muted-foreground/40" /> : <Film className="h-8 w-8 text-muted-foreground/40" />}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="h-12 w-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/30">
            <PlayIcon className="h-5 w-5 text-primary-foreground ml-0.5" />
          </div>
        </div>
        <Badge className="absolute top-2 left-2 text-[9px] font-mono bg-background/80 backdrop-blur-sm text-foreground border-border/50 px-1.5 py-0.5">
          {item.tipo === "filme" ? "Filme" : "Série"}
        </Badge>
      </div>
      <div className="mt-2 space-y-0.5 px-0.5">
        <p className="text-xs font-medium text-foreground truncate">{item.titulo}</p>
        <div className="flex items-center gap-2">
          <ViewsBadge views={item.views} />
          {item.idioma && <span className="text-[10px] text-muted-foreground font-mono">{item.idioma}</span>}
        </div>
      </div>
    </motion.button>
  );
}

// ── Category Row with lazy pagination ──
function CategoryRow({
  title,
  items,
  onSelect,
  hasMore,
  onLoadMore,
  loadingMore,
}: {
  title: string;
  items: ContentItem[];
  onSelect: (item: ContentItem) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold font-mono text-foreground tracking-tight">{title}</h2>
        <span className="text-[10px] text-muted-foreground font-mono">{items.length} títulos{hasMore ? "+" : ""}</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} onClick={() => onSelect(item)} />
        ))}
        {hasMore && (
          <div className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] flex items-center justify-center">
            <button
              onClick={onLoadMore}
              disabled={loadingMore}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 hover:border-primary/40 transition-colors text-xs font-mono text-muted-foreground hover:text-primary"
            >
              {loadingMore ? <Loader2 className="h-5 w-5 animate-spin" /> : <ChevronRight className="h-5 w-5" />}
              {loadingMore ? "Carregando..." : "Ver mais"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Episodes List ──
function EpisodesList({
  episodes,
  onSelectEpisode,
  selectedEpisodeId,
}: {
  episodes: Episode[];
  onSelectEpisode: (ep: Episode) => void;
  selectedEpisodeId?: string;
}) {
  const seasons = useMemo(() => {
    const map = new Map<number, Episode[]>();
    episodes.forEach((ep) => {
      const list = map.get(ep.temporada) || [];
      list.push(ep);
      map.set(ep.temporada, list);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [episodes]);

  const [activeSeason, setActiveSeason] = useState(seasons[0]?.[0] || 1);
  const activeEpisodes = seasons.find(([s]) => s === activeSeason)?.[1] || [];

  return (
    <div className="space-y-3">
      {seasons.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {seasons.map(([season]) => (
            <button
              key={season}
              onClick={() => setActiveSeason(season)}
              className={`px-3 py-1 rounded-full text-[11px] font-mono whitespace-nowrap transition-all ${
                activeSeason === season
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              T{season}
            </button>
          ))}
        </div>
      )}
      <div className="space-y-1.5 max-h-[40vh] overflow-y-auto scrollbar-none">
        {activeEpisodes.map((ep) => (
          <button
            key={ep.id}
            onClick={() => onSelectEpisode(ep)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
              selectedEpisodeId === ep.id
                ? "bg-primary/20 ring-1 ring-primary/30"
                : "bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-mono text-white/60">{ep.episodio}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">
                E{ep.episodio} - {ep.nome}
              </p>
              <p className="text-[10px] text-white/40 font-mono">Temporada {ep.temporada}</p>
            </div>
            <PlayIcon className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Player Modal ──
function PlayerView({
  item,
  onClose,
  xtreamConfig,
  playSource,
}: {
  item: ContentItem;
  onClose: () => void;
  xtreamConfig: XtreamConfig | null;
  playSource: string;
}) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEps, setLoadingEps] = useState(false);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState(item.video_url || "");
  const [selectedEpId, setSelectedEpId] = useState<string | undefined>();
  const isNative = Capacitor.isNativePlatform();
  const proxyBase = `https://bold-block-8917.denysouzah7.workers.dev`;

  // Fetch episodes
  useEffect(() => {
    if (item.tipo !== "serie") return;
    setLoadingEps(true);

    const fetchEps = async () => {
      try {
        if (playSource === "xtream" && xtreamConfig && item.series_id) {
          // Xtream: call directly on native, via edge function on web
          let data: any;
          if (isNative) {
            const res = await fetch(
              `${xtreamConfig.url.replace(/\/$/, "")}/player_api.php?username=${encodeURIComponent(xtreamConfig.username)}&password=${encodeURIComponent(xtreamConfig.password)}&action=get_series_info&series_id=${item.series_id}`
            );
            data = await res.json();
            // Build episodes from data.episodes object
            const eps: Episode[] = [];
            const seasonsObj = data.episodes || {};
            Object.entries(seasonsObj).forEach(([season, epsArr]: [string, any]) => {
              if (Array.isArray(epsArr)) {
                epsArr.forEach((ep: any) => {
                  eps.push({
                    id: String(ep.id),
                    nome: ep.title || String(ep.episode_num),
                    link: `${xtreamConfig.url.replace(/\/$/, "")}/series/${xtreamConfig.username}/${xtreamConfig.password}/${ep.id}.${ep.container_extension || "mkv"}`,
                    temporada: Number(season),
                    episodio: Number(ep.episode_num),
                    historico: "",
                  });
                });
              }
            });
            eps.sort((a, b) => a.temporada - b.temporada || a.episodio - b.episodio);
            setEpisodes(eps);
            if (eps.length > 0) {
              setActiveVideoUrl(eps[0].link);
              setSelectedEpId(eps[0].id);
              setShowEpisodes(true);
            }
          } else {
            const { data: fnData } = await supabase.functions.invoke("xtream-catalog", {
              body: {
                action: "series_episodes",
                url: xtreamConfig.url,
                username: xtreamConfig.username,
                password: xtreamConfig.password,
                series_id: item.series_id,
              },
            });
            const eps = fnData?.episodes || [];
            setEpisodes(eps);
            if (eps.length > 0) {
              setActiveVideoUrl(eps[0].link);
              setSelectedEpId(eps[0].id);
              setShowEpisodes(true);
            }
          }
        } else {
          // Baserow
          const { data } = await supabase.functions.invoke("baserow-content", {
            body: { action: "episodes", serie_name: item.titulo },
          });
          const eps = data?.episodes || [];
          setEpisodes(eps);
          if (eps.length > 0) {
            setActiveVideoUrl(eps[0].link);
            setSelectedEpId(eps[0].id);
            setShowEpisodes(true);
          }
        }
      } catch (e) {
        console.error("Error loading episodes", e);
      } finally {
        setLoadingEps(false);
      }
    };
    fetchEps();
  }, [item]);

  const url = activeVideoUrl;
  const isDirectVideo = /\.(mp4|mkv|webm|avi|mov|ts)(\?.*)?$/i.test(url);
  const isHttp = url.startsWith("http://");

  // On native: use direct URL (ExoPlayer handles it)
  // On web: proxy HTTP URLs
  const getVideoSrc = (rawUrl: string) => {
    if (isNative) return rawUrl;
    if (isHttp) return `${proxyBase}?url=${encodeURIComponent(rawUrl)}`;
    return rawUrl;
  };

  const videoSrc = getVideoSrc(url);

  // Try direct first on native, fallback to proxy on failure
  const [videoError, setVideoError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  const handleVideoError = useCallback(() => {
    if (!videoError && isNative && isHttp) {
      setVideoError(true);
      setUseFallback(true);
    }
  }, [videoError, isNative, isHttp]);

  const finalSrc = useFallback ? `${proxyBase}?url=${encodeURIComponent(url)}` : videoSrc;

  const handleSelectEpisode = (ep: Episode) => {
    setActiveVideoUrl(ep.link);
    setSelectedEpId(ep.id);
    setVideoError(false);
    setUseFallback(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 left-3 z-20 h-9 w-9 rounded-full flex items-center justify-center bg-black/70 backdrop-blur-sm text-white/80 hover:text-white active:scale-95 transition-all ring-1 ring-white/10"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Video Area */}
      <div className="w-full aspect-video bg-black flex items-center justify-center flex-shrink-0">
        {isDirectVideo ? (
          <video
            key={finalSrc}
            src={finalSrc}
            controls
            autoPlay
            className="w-full h-full object-contain"
            controlsList="nodownload"
            playsInline
            onError={handleVideoError}
          >
            Seu navegador não suporta vídeo.
          </video>
        ) : url ? (
          <iframe
            key={url}
            src={url}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen"
            style={{ border: "none" }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Film className="h-8 w-8 text-white/20" />
            <p className="text-white/30 text-xs font-mono">Nenhum link disponível</p>
          </div>
        )}
      </div>

      {/* Info + Episodes Panel */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.25 }}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        <h2 className="text-base font-bold text-white leading-tight">{item.titulo}</h2>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-primary/20 text-primary ring-1 ring-primary/30">
            {item.tipo === "filme" ? "Filme" : "Série"}
          </span>
          {item.idioma && <span className="text-[10px] font-mono text-white/50">{item.idioma}</span>}
          {item.temporadas > 0 && (
            <span className="text-[10px] text-white/50 font-mono flex items-center gap-1">
              <Tv className="h-3 w-3" /> {item.temporadas} temp.
            </span>
          )}
          <ViewsBadge views={item.views} />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {item.categoria.split(",").map((cat) => (
            <span key={cat.trim()} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-white/50 ring-1 ring-white/10">
              {cat.trim()}
            </span>
          ))}
        </div>

        {item.sinopse && (
          <p className="text-xs text-white/40 leading-relaxed">{item.sinopse}</p>
        )}

        {/* Episodes section for series */}
        {item.tipo === "serie" && (
          <div className="pt-2 border-t border-white/5">
            <button
              onClick={() => setShowEpisodes(!showEpisodes)}
              className="flex items-center gap-2 w-full py-2"
            >
              <List className="h-4 w-4 text-white/60" />
              <span className="text-sm font-mono font-semibold text-white/80">
                Episódios {episodes.length > 0 && `(${episodes.length})`}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-white/40 ml-auto transition-transform ${showEpisodes ? "rotate-180" : ""}`} />
            </button>

            {loadingEps && (
              <div className="flex items-center gap-2 py-4 justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs text-white/40 font-mono">Carregando episódios...</span>
              </div>
            )}

            {showEpisodes && !loadingEps && episodes.length > 0 && (
              <EpisodesList
                episodes={episodes}
                onSelectEpisode={handleSelectEpisode}
                selectedEpisodeId={selectedEpId}
              />
            )}

            {!loadingEps && episodes.length === 0 && (
              <p className="text-xs text-white/30 font-mono py-2">Nenhum episódio encontrado</p>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Category Browser (Xtream) ──
function XtreamCategoryBrowser({
  config,
  tipoFilter,
  search,
  onSelect,
}: {
  config: XtreamConfig;
  tipoFilter: string;
  search: string;
  onSelect: (item: ContentItem) => void;
}) {
  const [categories, setCategories] = useState<XtreamCategory[]>([]);
  const [selectedCat, setSelectedCat] = useState<XtreamCategory | null>(null);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  // Load categories
  useEffect(() => {
    const load = async () => {
      setLoadingCats(true);
      try {
        let cats: XtreamCategory[] = [];
        if (isNative) {
          const base = config.url.replace(/\/$/, "");
          const auth = `username=${encodeURIComponent(config.username)}&password=${encodeURIComponent(config.password)}`;
          const [vodCats, seriesCats] = await Promise.all([
            fetch(`${base}/player_api.php?${auth}&action=get_vod_categories`).then(r => r.json()).catch(() => []),
            fetch(`${base}/player_api.php?${auth}&action=get_series_categories`).then(r => r.json()).catch(() => []),
          ]);
          cats = [
            ...(Array.isArray(vodCats) ? vodCats.map((c: any) => ({ id: c.category_id, nome: c.category_name, tipo: "filme" as const })) : []),
            ...(Array.isArray(seriesCats) ? seriesCats.map((c: any) => ({ id: c.category_id, nome: c.category_name, tipo: "serie" as const })) : []),
          ];
        } else {
          const { data } = await supabase.functions.invoke("xtream-catalog", {
            body: { action: "categories", url: config.url, username: config.username, password: config.password },
          });
          cats = data?.categories || [];
        }
        setCategories(cats);
        if (cats.length > 0) setSelectedCat(cats[0]);
      } catch (e) {
        console.error("Error loading Xtream categories", e);
      } finally {
        setLoadingCats(false);
      }
    };
    load();
  }, [config]);

  // Load items when category changes
  useEffect(() => {
    if (!selectedCat) return;
    setItems([]);
    setPage(1);
    setHasMore(false);
    loadPage(selectedCat, 1, false);
  }, [selectedCat]);

  const loadPage = async (cat: XtreamCategory, p: number, append: boolean) => {
    if (p === 1) setLoadingItems(true);
    else setLoadingMore(true);

    try {
      const action = cat.tipo === "serie" ? "series" : "vod";
      let newItems: ContentItem[] = [];
      let moreAvailable = false;

      if (isNative) {
        const base = config.url.replace(/\/$/, "");
        const auth = `username=${encodeURIComponent(config.username)}&password=${encodeURIComponent(config.password)}`;
        const apiAction = cat.tipo === "serie" ? "get_series" : "get_vod_streams";
        const res = await fetch(`${base}/player_api.php?${auth}&action=${apiAction}&category_id=${cat.id}`);
        const all = await res.json().catch(() => []);
        const start = (p - 1) * PAGE_SIZE;
        const slice = Array.isArray(all) ? all.slice(start, start + PAGE_SIZE) : [];
        moreAvailable = start + PAGE_SIZE < (Array.isArray(all) ? all.length : 0);

        newItems = slice.map((s: any) => cat.tipo === "serie" ? ({
          id: String(s.series_id),
          titulo: s.name || "",
          capa_url: s.cover || "",
          sinopse: s.plot || "",
          categoria: cat.nome,
          categoria_id: String(cat.id),
          video_url: "",
          tipo: "serie" as const,
          idioma: "",
          views: Number(s.rating || 0),
          temporadas: 0,
          series_id: String(s.series_id),
        }) : ({
          id: String(s.stream_id || s.num),
          titulo: s.name || "",
          capa_url: s.stream_icon || "",
          sinopse: s.plot || "",
          categoria: cat.nome,
          categoria_id: String(cat.id),
          video_url: `${base}/movie/${config.username}/${config.password}/${s.stream_id}.${s.container_extension || "mp4"}`,
          tipo: "filme" as const,
          idioma: "",
          views: Number(s.rating || 0),
          temporadas: 0,
          stream_id: String(s.stream_id),
        }));
      } else {
        const { data } = await supabase.functions.invoke("xtream-catalog", {
          body: {
            action,
            url: config.url,
            username: config.username,
            password: config.password,
            category_id: cat.id,
            page: p,
            limit: PAGE_SIZE,
          },
        });
        newItems = data?.items || [];
        moreAvailable = data?.has_more || false;
      }

      setItems(prev => append ? [...prev, ...newItems] : newItems);
      setHasMore(moreAvailable);
      setPage(p);
    } catch (e) {
      console.error("Error loading Xtream items", e);
    } finally {
      setLoadingItems(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!selectedCat || loadingMore) return;
    loadPage(selectedCat, page + 1, true);
  };

  // Filter categories by tipo
  const filteredCats = categories.filter(c => tipoFilter === "todos" || c.tipo === tipoFilter);

  // Filter items by search
  const filteredItems = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(i => i.titulo.toLowerCase().includes(q) || i.sinopse.toLowerCase().includes(q));
  }, [items, search]);

  if (loadingCats) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-mono">Conectando ao servidor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filteredCats.map((cat) => (
          <button
            key={`${cat.tipo}-${cat.id}`}
            onClick={() => setSelectedCat(cat)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-mono whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedCat?.id === cat.id && selectedCat?.tipo === cat.tipo
                ? "bg-primary/15 text-primary ring-1 ring-primary/30 font-semibold"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {cat.tipo === "serie" ? <Tv className="h-3 w-3" /> : <Film className="h-3 w-3" />}
            {cat.nome}
          </button>
        ))}
      </div>

      {/* Items grid */}
      {loadingItems ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-mono">Carregando conteúdo...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {selectedCat && (
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold font-mono text-foreground">{selectedCat.nome}</h2>
              <span className="text-[10px] text-muted-foreground font-mono">{filteredItems.length} títulos{hasMore ? "+" : ""}</span>
            </div>
          )}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
            {filteredItems.map((item) => (
              <ContentCard key={item.id} item={item} onClick={() => onSelect(item)} />
            ))}
            {hasMore && !search && (
              <div className="flex-shrink-0 w-[140px] sm:w-[160px] flex items-center justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 hover:border-primary/40 transition-colors text-xs font-mono text-muted-foreground hover:text-primary"
                >
                  {loadingMore ? <Loader2 className="h-5 w-5 animate-spin" /> : <ChevronRight className="h-5 w-5" />}
                  {loadingMore ? "..." : "Ver mais"}
                </button>
              </div>
            )}
          </div>
          {filteredItems.length === 0 && !loadingItems && (
            <div className="flex flex-col items-center py-12 text-center space-y-2">
              <Film className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground font-mono">Nenhum título encontrado</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──
export default function PlayPage() {
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [selected, setSelected] = useState<ContentItem | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [sessoes, setSessoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playSource, setPlaySource] = useState<string>("baserow");
  const [xtreamConfig, setXtreamConfig] = useState<XtreamConfig | null>(null);

  // Load config first
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data } = await supabase.from("admin_config").select("play_source, xtream_url, xtream_username, xtream_password").eq("id", 1).single();
        if (data) {
          const source = (data as any).play_source || "baserow";
          setPlaySource(source);
          if (source === "xtream" && (data as any).xtream_url) {
            setXtreamConfig({
              url: (data as any).xtream_url,
              username: (data as any).xtream_username || "",
              password: (data as any).xtream_password || "",
            });
          }
        }
      } catch (e) {
        console.error("Error loading play config", e);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  // Load Baserow catalog only when source is baserow
  useEffect(() => {
    if (playSource !== "baserow") return;
    const fetchContent = async () => {
      try {
        setLoading(true);
        const { data, error: fnError } = await supabase.functions.invoke("baserow-content");
        if (fnError) throw fnError;
        setContent(data.items || []);
        setSessoes(data.sessoes || []);
      } catch (err: any) {
        console.error("Error fetching content:", err);
        setError("Erro ao carregar conteúdo");
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [playSource]);

  const filtered = useMemo(() => {
    return content.filter((item) => {
      const matchTipo = tipoFilter === "todos" || item.tipo === tipoFilter;
      const matchSearch =
        !search ||
        item.titulo.toLowerCase().includes(search.toLowerCase()) ||
        item.sinopse.toLowerCase().includes(search.toLowerCase());
      return matchTipo && matchSearch;
    });
  }, [search, tipoFilter, content]);

  const groupedByCategoria = useMemo(() => {
    const groups: Record<string, ContentItem[]> = {};
    if (sessoes.length > 0) {
      sessoes.forEach((sessao) => {
        const key = sessao.categoria;
        const tipoLower = (sessao.tipo || "").toLowerCase();
        const sessaoTipo = tipoLower === "série" || tipoLower === "serie" ? "serie" : "filme";
        const matching = filtered.filter((item) => {
          const itemCats = item.categoria.split(",").map((c: string) => c.trim().toLowerCase());
          return itemCats.includes(key.toLowerCase()) && item.tipo === sessaoTipo;
        });
        if (matching.length > 0) groups[`${key} (${sessao.tipo})`] = matching;
      });
    }
    filtered.forEach((item) => {
      item.categoria.split(",").forEach((cat: string) => {
        const trimmed = cat.trim();
        if (trimmed) {
          const inSession = sessoes.some((s: any) => s.categoria.toLowerCase() === trimmed.toLowerCase());
          if (!inSession) {
            if (!groups[trimmed]) groups[trimmed] = [];
            if (!groups[trimmed].find((i) => i.id === item.id)) groups[trimmed].push(item);
          }
        }
      });
    });
    return groups;
  }, [filtered, sessoes]);

  const featured = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => b.views - a.views);
    return sorted[0] || null;
  }, [filtered]);

  return (
    <Layout>
      <div className="space-y-6 pb-8">
        <div className="mb-5">
          <BackButton />
        </div>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center ring-1 ring-primary/20">
            <PlayIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-mono text-foreground">Play</h1>
            <p className="text-[10px] text-muted-foreground/60 font-mono flex items-center gap-1">
              {playSource === "xtream" ? (
                <><Server className="h-3 w-3" /> Servidor IPTV</>
              ) : "Filmes e séries para assistir"}
            </p>
          </div>
        </div>

        <form role="presentation" autoComplete="off" onSubmit={(e) => e.preventDefault()}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              placeholder="Buscar títulos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-card/50 border-border/30 text-sm font-mono"
            />
          </div>
        </form>

        {/* Type filter (always visible) */}
        <div className="flex gap-2">
          {TIPOS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTipoFilter(t.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                tipoFilter === t.value
                  ? "bg-primary/15 text-primary ring-1 ring-primary/30 font-semibold"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {t.icon && <t.icon className="h-3 w-3" />}
              {t.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-mono">
              {playSource === "xtream" ? "Conectando ao servidor..." : "Carregando catálogo..."}
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <p className="text-sm text-destructive font-mono">{error}</p>
          </div>
        )}

        {/* Xtream content */}
        {!loading && !error && playSource === "xtream" && xtreamConfig && (
          <XtreamCategoryBrowser
            config={xtreamConfig}
            tipoFilter={tipoFilter}
            search={search}
            onSelect={setSelected}
          />
        )}

        {/* Xtream not configured */}
        {!loading && playSource === "xtream" && !xtreamConfig && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <Server className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground font-mono">Servidor IPTV não configurado</p>
            <p className="text-xs text-muted-foreground/60 font-mono">Configure no painel admin → Play</p>
          </div>
        )}

        {/* Baserow content */}
        {!loading && !error && playSource === "baserow" && (
          <>
            {featured && !search && (
              <motion.button
                onClick={() => setSelected(featured)}
                className="relative w-full aspect-video rounded-2xl overflow-hidden ring-1 ring-border/30 group text-left"
                whileTap={{ scale: 0.98 }}
              >
                <img
                  src={featured.capa_url}
                  alt={featured.titulo}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2">
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-mono">⭐ Destaque</Badge>
                  <h2 className="text-lg font-bold font-mono text-foreground">{featured.titulo}</h2>
                  <p className="text-xs text-muted-foreground line-clamp-2">{featured.sinopse}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-mono font-semibold">
                      <PlayIcon className="h-3.5 w-3.5" /> Assistir
                    </div>
                    <ViewsBadge views={featured.views} />
                    <span className="text-[10px] text-muted-foreground font-mono">{featured.idioma}</span>
                  </div>
                </div>
              </motion.button>
            )}

            {Object.keys(groupedByCategoria).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedByCategoria).map(([cat, items]) => (
                  <CategoryRow key={cat} title={cat} items={items} onSelect={setSelected} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-muted/30 flex items-center justify-center">
                  <Film className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground font-mono">Nenhum título encontrado</p>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <PlayerView
            item={selected}
            onClose={() => setSelected(null)}
            xtreamConfig={xtreamConfig}
            playSource={playSource}
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}
