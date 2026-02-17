import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Headphones, ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ChevronRight, Clock, User, BookOpen, Heart, ChevronDown, RotateCcw, Maximize2, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Categoria {
  id: string;
  nome: string;
  icone: string;
}

interface Audiobook {
  id: string;
  titulo: string;
  autor: string | null;
  descricao: string | null;
  capa_url: string | null;
  audio_url: string;
  duracao_segundos: number;
  categoria_id: string | null;
  ordem: number;
}

interface Capitulo {
  id: string;
  audiobook_id: string;
  titulo: string;
  descricao: string | null;
  audio_url: string;
  duracao_segundos: number;
  ordem: number;
}

interface Progresso {
  audiobook_id: string;
  capitulo_id: string | null;
  posicao_segundos: number;
  concluido: boolean;
}

type View = "categories" | "books" | "detail";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
};

const Audiobooks = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
  const [capitulos, setCapitulos] = useState<Capitulo[]>([]);
  const [progressos, setProgressos] = useState<Progresso[]>([]);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [view, setView] = useState<View>("categories");
  const [selectedCategory, setSelectedCategory] = useState<Categoria | null>(null);
  const [selectedBook, setSelectedBook] = useState<Audiobook | null>(null);
  const [playingCapitulo, setPlayingCapitulo] = useState<Capitulo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playerExpanded, setPlayerExpanded] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const saveInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, bookRes, capRes, progRes, favRes] = await Promise.all([
        supabase.from("audiobook_categorias").select("*").order("ordem"),
        supabase.from("audiobooks").select("*").order("ordem"),
        supabase.from("audiobook_capitulos").select("*").order("ordem"),
        supabase.from("audiobook_progresso").select("audiobook_id, capitulo_id, posicao_segundos, concluido"),
        session?.user?.id
          ? supabase.from("audiobook_favoritos").select("audiobook_id")
          : Promise.resolve({ data: [] }),
      ]);
      if (catRes.data) setCategorias(catRes.data);
      if (bookRes.data) setAudiobooks(bookRes.data);
      if (capRes.data) setCapitulos(capRes.data);
      if (progRes.data) setProgressos(progRes.data);
      if (favRes.data) setFavoritos(favRes.data.map((f: any) => f.audiobook_id));
      setLoading(false);
    };
    fetchData();
  }, [session?.user?.id]);

  const toggleFavorite = async (bookId: string) => {
    if (!session?.user?.id) { toast.error("Faça login para curtir"); return; }
    const isFav = favoritos.includes(bookId);
    if (isFav) {
      await supabase.from("audiobook_favoritos").delete().eq("user_id", session.user.id).eq("audiobook_id", bookId);
      setFavoritos((prev) => prev.filter((id) => id !== bookId));
      toast.success("Removido dos favoritos");
    } else {
      await supabase.from("audiobook_favoritos").insert({ user_id: session.user.id, audiobook_id: bookId });
      setFavoritos((prev) => [...prev, bookId]);
      toast.success("Adicionado aos favoritos ❤️");
    }
  };

  const resetProgress = async (bookId: string) => {
    if (!session?.user?.id) return;
    await supabase.from("audiobook_progresso").delete().eq("user_id", session.user.id).eq("audiobook_id", bookId);
    setProgressos((prev) => prev.filter((p) => p.audiobook_id !== bookId));
    toast.success("Progresso resetado");
  };

  const saveProgress = useCallback(async () => {
    if (!playingCapitulo || !audioRef.current || !session?.user?.id) return;
    const pos = Math.floor(audioRef.current.currentTime);
    const concluido = audioRef.current.duration > 0 && pos >= audioRef.current.duration - 5;
    await supabase.from("audiobook_progresso").upsert(
      { user_id: session.user.id, audiobook_id: playingCapitulo.audiobook_id, capitulo_id: playingCapitulo.id, posicao_segundos: pos, concluido },
      { onConflict: "user_id,audiobook_id,capitulo_id" }
    );
    setProgressos((prev) => {
      const idx = prev.findIndex((p) => p.audiobook_id === playingCapitulo.audiobook_id && p.capitulo_id === playingCapitulo.id);
      const newP = { audiobook_id: playingCapitulo.audiobook_id, capitulo_id: playingCapitulo.id, posicao_segundos: pos, concluido };
      if (idx >= 0) return prev.map((p, i) => i === idx ? newP : p);
      return [...prev, newP];
    });
  }, [playingCapitulo, session?.user?.id]);

  const playCapitulo = (cap: Capitulo) => {
    if (playingCapitulo?.id === cap.id) { togglePlay(); return; }
    if (playingCapitulo) saveProgress();
    setPlayingCapitulo(cap);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    const audio = new Audio(cap.audio_url);
    audio.volume = muted ? 0 : volume;
    audioRef.current = audio;
    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
      const saved = progressos.find((p) => p.capitulo_id === cap.id);
      if (saved && saved.posicao_segundos > 0 && !saved.concluido) {
        audio.currentTime = saved.posicao_segundos;
        setCurrentTime(saved.posicao_segundos);
      }
      audio.play();
      setIsPlaying(true);
    });
    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      saveProgress();
      const bookCaps = capitulos.filter((c) => c.audiobook_id === cap.audiobook_id).sort((a, b) => a.ordem - b.ordem);
      const idx = bookCaps.findIndex((c) => c.id === cap.id);
      if (idx < bookCaps.length - 1) setTimeout(() => playCapitulo(bookCaps[idx + 1]), 1000);
    });
  };

  useEffect(() => {
    if (isPlaying) { saveInterval.current = setInterval(saveProgress, 15000); }
    return () => { if (saveInterval.current) clearInterval(saveInterval.current); };
  }, [isPlaying, saveProgress]);

  useEffect(() => {
    return () => { saveProgress(); if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; } };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); saveProgress(); } else { audioRef.current.play(); }
    setIsPlaying(!isPlaying);
  };

  const seek = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.duration, audioRef.current.currentTime + seconds));
  };

  const handleVolume = (value: number[]) => {
    const v = value[0];
    setVolume(v);
    setMuted(v === 0);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const toggleMute = () => {
    if (audioRef.current) audioRef.current.volume = muted ? volume || 0.5 : 0;
    setMuted(!muted);
  };

  const getCapProgress = (capId: string) => {
    const p = progressos.find((pr) => pr.capitulo_id === capId);
    if (!p) return { percent: 0, concluido: false };
    const cap = capitulos.find((c) => c.id === capId);
    if (!cap || !cap.duracao_segundos) return { percent: 0, concluido: p.concluido };
    return { percent: Math.min(100, (p.posicao_segundos / cap.duracao_segundos) * 100), concluido: p.concluido };
  };

  const getBookTotalDuration = (bookId: string) => {
    return capitulos.filter((c) => c.audiobook_id === bookId).reduce((sum, c) => sum + (c.duracao_segundos || 0), 0);
  };

  const getBookProgress = (bookId: string) => {
    const caps = capitulos.filter((c) => c.audiobook_id === bookId);
    if (caps.length === 0) return 0;
    const completed = caps.filter((c) => progressos.find((p) => p.capitulo_id === c.id)?.concluido).length;
    return Math.round((completed / caps.length) * 100);
  };

  const handleBack = () => {
    if (view === "detail") setView("books");
    else if (view === "books") { setView("categories"); setSelectedCategory(null); }
    else navigate("/");
  };

  const selectCategory = (cat: Categoria) => { setSelectedCategory(cat); setView("books"); };
  const selectBook = (book: Audiobook) => { setSelectedBook(book); setView("detail"); };

  const booksInCategory = selectedCategory
    ? selectedCategory.id === "__uncategorized__"
      ? audiobooks.filter((b) => !b.categoria_id)
      : selectedCategory.id === "__favoritos__"
        ? audiobooks.filter((b) => favoritos.includes(b.id))
        : audiobooks.filter((b) => b.categoria_id === selectedCategory.id)
    : [];

  const bookCapitulos = selectedBook
    ? capitulos.filter((c) => c.audiobook_id === selectedBook.id).sort((a, b) => a.ordem - b.ordem)
    : [];

  const uncategorized = audiobooks.filter((b) => !b.categoria_id);
  const backLabel = view === "detail" ? selectedCategory?.nome || "Voltar" : view === "books" ? "Categorias" : "Voltar";

  const playingBook = playingCapitulo ? audiobooks.find((b) => b.id === playingCapitulo.audiobook_id) : null;
  const playingBookCaps = playingCapitulo
    ? capitulos.filter((c) => c.audiobook_id === playingCapitulo.audiobook_id).sort((a, b) => a.ordem - b.ordem)
    : [];

  return (
    <Layout>
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl mx-auto space-y-6 pb-32">
        {/* Header */}
        <motion.div variants={item}>
          <Button variant="ghost" size="sm" className="gap-1.5 mb-4 -ml-2 text-muted-foreground" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" /> {backLabel}
          </Button>

          {view === "categories" && (
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Headphones className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-mono">Audiobooks</h1>
                <p className="text-xs text-muted-foreground">Escolha uma categoria para começar</p>
              </div>
            </div>
          )}

          {view === "books" && selectedCategory && (
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <span className="text-lg">{selectedCategory.icone}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold font-mono">{selectedCategory.nome}</h1>
                <p className="text-xs text-muted-foreground">{booksInCategory.length} título{booksInCategory.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
          )}
        </motion.div>

        {loading ? (
          <motion.div variants={item} className="text-center py-12">
            <p className="text-sm text-muted-foreground font-mono">Carregando...</p>
          </motion.div>
        ) : view === "categories" ? (
          <CategoriesView
            categorias={categorias}
            audiobooks={audiobooks}
            uncategorized={uncategorized}
            favoritosCount={favoritos.length}
            onSelect={selectCategory}
          />
        ) : view === "books" ? (
          <BooksListView
            books={booksInCategory}
            capitulos={capitulos}
            favoritos={favoritos}
            getBookTotalDuration={getBookTotalDuration}
            getBookProgress={getBookProgress}
            onSelect={selectBook}
            onToggleFavorite={toggleFavorite}
          />
        ) : view === "detail" && selectedBook ? (
          <BookDetailView
            book={selectedBook}
            capitulos={bookCapitulos}
            playingCapitulo={playingCapitulo}
            isPlaying={isPlaying}
            isFavorite={favoritos.includes(selectedBook.id)}
            getCapProgress={getCapProgress}
            getBookProgress={getBookProgress}
            onPlayCapitulo={playCapitulo}
            onToggleFavorite={() => toggleFavorite(selectedBook.id)}
            onResetProgress={() => resetProgress(selectedBook.id)}
          />
        ) : null}
      </motion.div>

      {/* Mini Player */}
      <AnimatePresence>
        {playingCapitulo && !playerExpanded && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl"
          >
            <div className="max-w-2xl mx-auto px-4 py-3 space-y-2">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-lg overflow-hidden shrink-0 cursor-pointer"
                  onClick={() => setPlayerExpanded(true)}
                >
                  {playingBook?.capa_url ? (
                    <img src={playingBook.capa_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                      <Headphones className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setPlayerExpanded(true)}>
                  <p className="text-xs font-mono font-medium truncate">{playingCapitulo.titulo}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{playingBook?.titulo}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => skip(-15)}>
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20" onClick={togglePlay}>
                    {isPlaying ? <Pause className="h-5 w-5 text-primary" /> : <Play className="h-5 w-5 text-primary ml-0.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => skip(30)}>
                    <SkipForward className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPlayerExpanded(true)}>
                    <Maximize2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground w-12 text-right">{formatTime(currentTime)}</span>
                <Slider value={[currentTime]} max={duration || 1} step={1} onValueChange={seek} className="flex-1" />
                <span className="text-[10px] font-mono text-muted-foreground w-12">{formatTime(duration)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Full-Screen Player */}
      <AnimatePresence>
        {playingCapitulo && playerExpanded && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[100] flex flex-col bg-background"
          >
            {/* Background blur with cover */}
            {playingBook?.capa_url && (
              <div className="absolute inset-0 overflow-hidden">
                <img src={playingBook.capa_url} alt="" className="w-full h-full object-cover opacity-10 blur-3xl scale-110" />
                <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/90 to-background" />
              </div>
            )}

            <div className="relative flex-1 flex flex-col max-w-lg mx-auto w-full px-6">
              {/* Top bar */}
              <div className="flex items-center justify-between py-4 pt-6">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setPlayerExpanded(false); setShowChapterList(false); }}>
                  <ChevronDown className="h-5 w-5" />
                </Button>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Reproduzindo</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setShowChapterList(!showChapterList)}
                >
                  <List className="h-5 w-5" />
                </Button>
              </div>

              <AnimatePresence mode="wait">
                {showChapterList ? (
                  /* Chapter list inside expanded player */
                  <motion.div
                    key="chapters"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    className="flex-1 overflow-auto pb-4"
                  >
                    <h3 className="text-sm font-mono font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Capítulos</h3>
                    <div className="space-y-1.5">
                      {playingBookCaps.map((cap, idx) => {
                        const isActive = playingCapitulo?.id === cap.id;
                        const { percent, concluido } = getCapProgress(cap.id);
                        return (
                          <div
                            key={cap.id}
                            onClick={() => playCapitulo(cap)}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                              isActive ? "bg-primary/15 border border-primary/30" : "hover:bg-muted/50"
                            }`}
                          >
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                              isActive ? "bg-primary/20" : "bg-secondary/50"
                            }`}>
                              {isActive && isPlaying ? (
                                <Pause className="h-3.5 w-3.5 text-primary" />
                              ) : isActive ? (
                                <Play className="h-3.5 w-3.5 text-primary ml-0.5" />
                              ) : (
                                <span className="text-[10px] font-mono font-semibold text-muted-foreground">{idx + 1}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-mono truncate ${isActive ? "font-semibold text-primary" : ""}`}>{cap.titulo}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {cap.duracao_segundos > 0 && <span className="text-[10px] text-muted-foreground font-mono">{formatTime(cap.duracao_segundos)}</span>}
                                {concluido && <span className="text-[9px] font-mono text-primary">✓</span>}
                                {percent > 0 && !concluido && (
                                  <div className="w-12 h-1 rounded-full bg-secondary/50 overflow-hidden">
                                    <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  /* Main player view */
                  <motion.div
                    key="player"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="flex-1 flex flex-col items-center justify-center gap-6"
                  >
                    {/* Cover art */}
                    <motion.div
                      animate={{ scale: isPlaying ? 1 : 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="w-56 h-56 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-2xl"
                    >
                      {playingBook?.capa_url ? (
                        <img src={playingBook.capa_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                          <Headphones className="h-16 w-16 text-primary/40" />
                        </div>
                      )}
                    </motion.div>

                    {/* Title & Author */}
                    <div className="text-center w-full px-4">
                      <h2 className="text-lg font-bold font-mono truncate">{playingCapitulo.titulo}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{playingBook?.titulo}</p>
                      {playingBook?.autor && <p className="text-xs text-muted-foreground/70 mt-0.5">{playingBook.autor}</p>}
                    </div>

                    {/* Progress slider */}
                    <div className="w-full space-y-1">
                      <Slider value={[currentTime]} max={duration || 1} step={1} onValueChange={seek} className="w-full" />
                      <div className="flex justify-between">
                        <span className="text-[10px] font-mono text-muted-foreground">{formatTime(currentTime)}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">-{formatTime(Math.max(0, duration - currentTime))}</span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-6">
                      <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => skip(-15)}>
                        <SkipBack className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-16 w-16 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                        onClick={togglePlay}
                      >
                        {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-1" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => skip(30)}>
                        <SkipForward className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Bottom actions: Like & Volume */}
                    <div className="flex items-center justify-between w-full">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => playingBook && toggleFavorite(playingBook.id)}
                      >
                        <Heart className={`h-5 w-5 transition-colors ${playingBook && favoritos.includes(playingBook.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
                          {muted ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                        <Slider value={[muted ? 0 : volume]} max={1} step={0.01} onValueChange={handleVolume} className="w-24" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

// ── Categories Grid ──
function CategoriesView({ categorias, audiobooks, uncategorized, favoritosCount, onSelect }: {
  categorias: Categoria[];
  audiobooks: Audiobook[];
  uncategorized: Audiobook[];
  favoritosCount: number;
  onSelect: (cat: Categoria) => void;
}) {
  if (categorias.length === 0 && uncategorized.length === 0 && favoritosCount === 0) {
    return (
      <motion.div variants={item} className="text-center py-12">
        <Headphones className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground font-mono">Nenhum audiobook disponível ainda</p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Favoritos card */}
      {favoritosCount > 0 && (
        <motion.div
          variants={item}
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect({ id: "__favoritos__", nome: "Favoritos", icone: "❤️" })}
          className="group relative cursor-pointer rounded-2xl border border-border bg-card overflow-hidden transition-all hover:border-red-400/40 hover:shadow-lg"
        >
          <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-red-500/10 to-red-500/5">
            <div className="w-full h-full flex items-center justify-center"><Heart className="h-10 w-10 text-red-400/60" /></div>
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-sm">❤️</span>
              <p className="font-mono text-sm font-semibold">Favoritos</p>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">{favoritosCount} título{favoritosCount !== 1 ? "s" : ""}</p>
          </div>
        </motion.div>
      )}

      {categorias.map((cat) => {
        const count = audiobooks.filter((b) => b.categoria_id === cat.id).length;
        const coverBook = audiobooks.find((b) => b.categoria_id === cat.id && b.capa_url);
        return (
          <motion.div
            key={cat.id}
            variants={item}
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(cat)}
            className="group relative cursor-pointer rounded-2xl border border-border bg-card overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg"
          >
            <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
              {coverBook?.capa_url ? (
                <img src={coverBook.capa_url} alt={cat.nome} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><span className="text-4xl">{cat.icone}</span></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm">{cat.icone}</span>
                <p className="font-mono text-sm font-semibold truncate">{cat.nome}</p>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">{count} {count === 1 ? "título" : "títulos"}</p>
            </div>
            <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-background/60 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="h-3.5 w-3.5 text-foreground" />
            </div>
          </motion.div>
        );
      })}

      {uncategorized.length > 0 && (
        <motion.div
          variants={item}
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect({ id: "__uncategorized__", nome: "Outros", icone: "📚" })}
          className="group relative cursor-pointer rounded-2xl border border-border bg-card overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg"
        >
          <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-muted to-muted/50">
            <div className="w-full h-full flex items-center justify-center"><span className="text-4xl">📚</span></div>
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-sm">📚</span>
              <p className="font-mono text-sm font-semibold">Outros</p>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">{uncategorized.length} título{uncategorized.length !== 1 ? "s" : ""}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Books List ──
function BooksListView({ books, capitulos, favoritos, getBookTotalDuration, getBookProgress, onSelect, onToggleFavorite }: {
  books: Audiobook[];
  capitulos: Capitulo[];
  favoritos: string[];
  getBookTotalDuration: (id: string) => number;
  getBookProgress: (id: string) => number;
  onSelect: (book: Audiobook) => void;
  onToggleFavorite: (id: string) => void;
}) {
  if (books.length === 0) {
    return (
      <motion.div variants={item} className="text-center py-12">
        <Headphones className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground font-mono">Nenhum título nesta categoria</p>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-3">
      {books.map((book) => {
        const totalDur = getBookTotalDuration(book.id);
        const progress = getBookProgress(book.id);
        const chapCount = capitulos.filter((c) => c.audiobook_id === book.id).length;
        const isFav = favoritos.includes(book.id);
        return (
          <motion.div
            key={book.id}
            variants={item}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="group flex items-center gap-4 p-4 rounded-xl bg-card border border-border transition-all hover:border-primary/30 hover:shadow-md"
          >
            <div className="cursor-pointer shrink-0" onClick={() => onSelect(book)}>
              {book.capa_url ? (
                <img src={book.capa_url} alt={book.titulo} className="h-20 w-16 rounded-lg object-cover shadow-sm" />
              ) : (
                <div className="flex h-20 w-16 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelect(book)}>
              <p className="font-mono text-sm font-semibold truncate">{book.titulo}</p>
              {book.autor && (
                <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <User className="h-3 w-3" /> {book.autor}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                {chapCount > 0 && <span className="text-[10px] text-muted-foreground font-mono">{chapCount} cap.</span>}
                {totalDur > 0 && (
                  <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5">
                    <Clock className="h-3 w-3" /> {formatDuration(totalDur)}
                  </span>
                )}
              </div>
              {progress > 0 && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 max-w-[120px] h-1 rounded-full bg-secondary/50 overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  {progress === 100 && <span className="text-[9px] font-mono text-primary">✓</span>}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(book.id); }}
            >
              <Heart className={`h-4 w-4 transition-colors ${isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Book Detail View ──
function BookDetailView({ book, capitulos, playingCapitulo, isPlaying, isFavorite, getCapProgress, getBookProgress, onPlayCapitulo, onToggleFavorite, onResetProgress }: {
  book: Audiobook;
  capitulos: Capitulo[];
  playingCapitulo: Capitulo | null;
  isPlaying: boolean;
  isFavorite: boolean;
  getCapProgress: (id: string) => { percent: number; concluido: boolean };
  getBookProgress: (id: string) => number;
  onPlayCapitulo: (cap: Capitulo) => void;
  onToggleFavorite: () => void;
  onResetProgress: () => void;
}) {
  const totalDuration = capitulos.reduce((sum, c) => sum + (c.duracao_segundos || 0), 0);
  const progress = getBookProgress(book.id);

  return (
    <div className="space-y-6">
      {/* Book Hero */}
      <motion.div variants={item} className="flex gap-5">
        {book.capa_url ? (
          <img src={book.capa_url} alt={book.titulo} className="h-40 w-28 rounded-xl object-cover shadow-lg shrink-0" />
        ) : (
          <div className="flex h-40 w-28 shrink-0 items-center justify-center rounded-xl bg-primary/10 shadow-lg">
            <BookOpen className="h-10 w-10 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0 py-1">
          <h2 className="text-lg font-bold font-mono leading-snug">{book.titulo}</h2>
          {book.autor && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> {book.autor}
            </p>
          )}
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
              <Headphones className="h-3.5 w-3.5" /> {capitulos.length} cap.
            </span>
            {totalDuration > 0 && (
              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {formatDuration(totalDuration)}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={onToggleFavorite}
            >
              <Heart className={`h-3.5 w-3.5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
              {isFavorite ? "Curtido" : "Curtir"}
            </Button>
            {progress > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs text-muted-foreground"
                onClick={onResetProgress}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Resetar
              </Button>
            )}
          </div>

          {/* Progress bar */}
          {progress > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">{progress}%</span>
            </div>
          )}
        </div>
      </motion.div>

      {book.descricao && (
        <motion.div variants={item} className="rounded-xl bg-card border border-border p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{book.descricao}</p>
        </motion.div>
      )}

      {/* Chapters List */}
      <motion.div variants={item}>
        <h3 className="text-sm font-mono font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Capítulos</h3>
        {capitulos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground font-mono">Nenhum capítulo adicionado ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {capitulos.map((cap, idx) => {
              const { percent, concluido } = getCapProgress(cap.id);
              const isActive = playingCapitulo?.id === cap.id;
              const isCapPlaying = isActive && isPlaying;
              return (
                <motion.div
                  key={cap.id}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onPlayCapitulo(cap)}
                  className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    isActive ? "bg-primary/10 border border-primary/30" : "bg-card border border-border hover:border-primary/20"
                  }`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                    isActive ? "bg-primary/20" : "bg-secondary/50 group-hover:bg-primary/10"
                  }`}>
                    {isCapPlaying ? <Pause className="h-4 w-4 text-primary" /> : isActive ? <Play className="h-4 w-4 text-primary ml-0.5" /> : (
                      <span className="text-xs font-mono font-semibold text-muted-foreground">{idx + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-mono truncate ${isActive ? "font-semibold text-primary" : "font-medium"}`}>{cap.titulo}</p>
                    {cap.descricao && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{cap.descricao}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      {cap.duracao_segundos > 0 && <span className="text-[10px] text-muted-foreground font-mono">{formatTime(cap.duracao_segundos)}</span>}
                      {concluido && <span className="text-[9px] font-mono text-primary">✓</span>}
                      {percent > 0 && !concluido && (
                        <div className="w-16 h-1 rounded-full bg-secondary/50 overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default Audiobooks;
