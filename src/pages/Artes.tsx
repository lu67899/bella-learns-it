import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import BackButton from "@/components/BackButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Palette, ExternalLink, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface Artwork {
  id: number;
  title: string;
  artist_display: string;
  date_display: string;
  medium_display: string;
  dimensions: string;
  thumbnail: { alt_text: string } | null;
  image_id: string | null;
  description: string | null;
  short_description: string | null;
  place_of_origin: string | null;
  department_title: string | null;
}

const FAMOUS_ARTISTS = [
  "Vincent van Gogh",
  "Claude Monet",
  "Pierre-Auguste Renoir",
  "Édouard Manet",
  "Paul Cézanne",
  "Rembrandt",
  "Gustav Klimt",
  "Georges Seurat",
  "Edgar Degas",
  "Camille Pissarro",
];

const IIIF_BASE = "https://www.artic.edu/iiif/2";

function getImageUrl(imageId: string | null, width = 843) {
  if (!imageId) return null;
  return `${IIIF_BASE}/${imageId}/full/${width},/0/default.jpg`;
}

export default function Artes() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<Artwork | null>(null);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchArt = async (pageNum: number, query?: string) => {
    const fields = "id,title,artist_display,date_display,medium_display,dimensions,thumbnail,image_id,description,short_description,place_of_origin,department_title";

    let apiUrl: string;
    if (query) {
      apiUrl = `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(query)}&fields=${fields}&limit=12&page=${pageNum}&query[term][is_public_domain]=true`;
    } else {
      const artist = FAMOUS_ARTISTS[Math.floor(Math.random() * FAMOUS_ARTISTS.length)];
      apiUrl = `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(artist)}&fields=${fields}&limit=12&page=${pageNum}&query[term][is_public_domain]=true`;
    }

    try {
      const { data: json, error } = await supabase.functions.invoke("art-proxy", {
        body: { url: apiUrl },
      });

      if (error) throw error;
      const filtered = (json?.data || []).filter((a: Artwork) => a.image_id);
      return {
        data: filtered,
        hasMore: json?.pagination?.total_pages > pageNum,
      };
    } catch (err) {
      console.error("Art API error:", err);
      return { data: [], hasMore: false };
    }
  };

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchArt(1, searchQuery || undefined).then(({ data, hasMore: more }) => {
      setArtworks(data);
      setHasMore(more);
      setLoading(false);
    });
  }, [searchQuery]);

  const loadMore = async () => {
    setLoadingMore(true);
    const next = page + 1;
    const { data, hasMore: more } = await fetchArt(next, searchQuery || undefined);
    setArtworks((prev) => [...prev, ...data]);
    setPage(next);
    setHasMore(more);
    setLoadingMore(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(search);
  };

  const stripHtml = (html: string | null) => {
    if (!html) return null;
    return html.replace(/<[^>]*>/g, "").trim();
  };

  return (
    <Layout>
      <div className="space-y-5">
        <BackButton to="/" />

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Galeria de Arte</h1>
            <p className="text-xs text-muted-foreground">Obras-primas de grandes artistas</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar artista ou obra..."
              className="pl-9"
            />
          </div>
          <Button type="submit" size="sm">Buscar</Button>
        </form>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        ) : artworks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Palette className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhuma obra encontrada.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {artworks.map((art) => (
                <Card
                  key={art.id}
                  className="overflow-hidden cursor-pointer group hover:ring-1 hover:ring-primary/30 transition-all"
                  onClick={() => setSelected(art)}
                >
                  <div className="aspect-[3/4] overflow-hidden bg-muted flex items-center justify-center">
                    <img
                      src={getImageUrl(art.image_id, 600) || ""}
                      alt={art.thumbnail?.alt_text || art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector(".fallback-icon")) {
                          const div = document.createElement("div");
                          div.className = "fallback-icon flex flex-col items-center justify-center text-muted-foreground/40 gap-1";
                          div.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg><span style="font-size:10px">Imagem indisponível</span>';
                          parent.appendChild(div);
                        }
                      }}
                    />
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-semibold text-foreground line-clamp-1">{art.title}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{art.artist_display}</p>
                    {art.date_display && (
                      <p className="text-[10px] text-muted-foreground/60">{art.date_display}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="gap-2"
                >
                  <ChevronDown className="h-4 w-4" />
                  {loadingMore ? "Carregando..." : "Ver mais obras"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">{selected.title}</DialogTitle>
                <DialogDescription className="text-xs">{selected.artist_display}</DialogDescription>
              </DialogHeader>

              <div className="rounded-xl overflow-hidden bg-muted">
                <img
                  src={getImageUrl(selected.image_id, 1686) || ""}
                  alt={selected.thumbnail?.alt_text || selected.title}
                  className="w-full h-auto"
                />
              </div>

              <div className="space-y-3 text-sm">
                {(selected.description || selected.short_description) && (
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {stripHtml(selected.short_description || selected.description)}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {selected.date_display && (
                    <div>
                      <p className="text-muted-foreground/60">Data</p>
                      <p className="text-foreground">{selected.date_display}</p>
                    </div>
                  )}
                  {selected.medium_display && (
                    <div>
                      <p className="text-muted-foreground/60">Técnica</p>
                      <p className="text-foreground">{selected.medium_display}</p>
                    </div>
                  )}
                  {selected.place_of_origin && (
                    <div>
                      <p className="text-muted-foreground/60">Origem</p>
                      <p className="text-foreground">{selected.place_of_origin}</p>
                    </div>
                  )}
                  {selected.department_title && (
                    <div>
                      <p className="text-muted-foreground/60">Departamento</p>
                      <p className="text-foreground">{selected.department_title}</p>
                    </div>
                  )}
                  {selected.dimensions && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground/60">Dimensões</p>
                      <p className="text-foreground">{selected.dimensions}</p>
                    </div>
                  )}
                </div>

                <a
                  href={`https://www.artic.edu/artworks/${selected.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Ver no Art Institute of Chicago
                </a>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
