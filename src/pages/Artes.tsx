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
  image_url: string;
  image_url_large: string;
  department: string;
  culture: string;
  period: string;
  external_url: string;
}

const FAMOUS_ARTISTS = [
  "Van Gogh",
  "Monet",
  "Renoir",
  "Rembrandt",
  "Klimt",
  "Degas",
  "Cézanne",
  "Vermeer",
  "Caravaggio",
  "Raphael",
];

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
    try {
      const searchTerm = query || FAMOUS_ARTISTS[Math.floor(Math.random() * FAMOUS_ARTISTS.length)];

      const { data: json, error } = await supabase.functions.invoke("art-proxy", {
        body: { query: searchTerm, page: pageNum, limit: 12 },
      });

      if (error) throw error;
      return {
        data: json?.data || [],
        hasMore: json?.hasMore || false,
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
                      src={art.image_url}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
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
                  src={selected.image_url_large}
                  alt={selected.title}
                  className="w-full h-auto"
                />
              </div>

              <div className="space-y-3 text-sm">
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
                  {selected.culture && (
                    <div>
                      <p className="text-muted-foreground/60">Cultura</p>
                      <p className="text-foreground">{selected.culture}</p>
                    </div>
                  )}
                  {selected.department && (
                    <div>
                      <p className="text-muted-foreground/60">Departamento</p>
                      <p className="text-foreground">{selected.department}</p>
                    </div>
                  )}
                  {selected.period && (
                    <div>
                      <p className="text-muted-foreground/60">Período</p>
                      <p className="text-foreground">{selected.period}</p>
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
                  href={selected.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Ver no Metropolitan Museum of Art
                </a>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
