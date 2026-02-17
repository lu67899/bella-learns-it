import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Headphones, ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

interface Progresso {
  audiobook_id: string;
  posicao_segundos: number;
  concluido: boolean;
}

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

const Audiobooks = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
  const [progressos, setProgressos] = useState<Progresso[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Categoria | null>(null);
  const [selectedBook, setSelectedBook] = useState<Audiobook | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const saveInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const [catRes, bookRes, progRes] = await Promise.all([
        supabase.from("audiobook_categorias").select("*").order("ordem"),
        supabase.from("audiobooks").select("*").order("ordem"),
        supabase.from("audiobook_progresso").select("audiobook_id, posicao_segundos, concluido"),
      ]);
      if (catRes.data) setCategorias(catRes.data);
      if (bookRes.data) setAudiobooks(bookRes.data);
      if (progRes.data) setProgressos(progRes.data);
      setLoading(false);
    };
    fetch();
  }, []);

  const saveProgress = useCallback(async () => {
    if (!selectedBook || !audioRef.current || !session?.user?.id) return;
    const pos = Math.floor(audioRef.current.currentTime);
    const concluido = audioRef.current.duration > 0 && pos >= audioRef.current.duration - 5;
    await supabase.from("audiobook_progresso").upsert(
      { user_id: session.user.id, audiobook_id: selectedBook.id, posicao_segundos: pos, concluido },
      { onConflict: "user_id,audiobook_id" }
    );
    setProgressos((prev) => {
      const existing = prev.find((p) => p.audiobook_id === selectedBook.id);
      if (existing) return prev.map((p) => p.audiobook_id === selectedBook.id ? { ...p, posicao_segundos: pos, concluido } : p);
      return [...prev, { audiobook_id: selectedBook.id, posicao_segundos: pos, concluido }];
    });
  }, [selectedBook, session?.user?.id]);

  const playBook = (book: Audiobook) => {
    if (selectedBook?.id === book.id) {
      togglePlay();
      return;
    }
    if (selectedBook) saveProgress();

    setSelectedBook(book);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }

    const audio = new Audio(book.audio_url);
    audio.volume = muted ? 0 : volume;
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
      const saved = progressos.find((p) => p.audiobook_id === book.id);
      if (saved && saved.posicao_segundos > 0 && !saved.concluido) {
        audio.currentTime = saved.posicao_segundos;
        setCurrentTime(saved.posicao_segundos);
      }
      audio.play();
      setIsPlaying(true);
    });

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      saveProgress();
    });
  };

  useEffect(() => {
    if (isPlaying) {
      saveInterval.current = setInterval(saveProgress, 15000);
    }
    return () => {
      if (saveInterval.current) clearInterval(saveInterval.current);
    };
  }, [isPlaying, saveProgress]);

  useEffect(() => {
    return () => {
      saveProgress();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      saveProgress();
    } else {
      audioRef.current.play();
    }
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
    if (audioRef.current) {
      audioRef.current.volume = muted ? volume || 0.5 : 0;
    }
    setMuted(!muted);
  };

  const getBookProgress = (bookId: string) => {
    const p = progressos.find((pr) => pr.audiobook_id === bookId);
    if (!p) return 0;
    const book = audiobooks.find((b) => b.id === bookId);
    if (!book || !book.duracao_segundos) return 0;
    return Math.min(100, (p.posicao_segundos / book.duracao_segundos) * 100);
  };

  const booksInCategory = selectedCategory
    ? audiobooks.filter((b) => b.categoria_id === selectedCategory.id)
    : [];

  const uncategorized = audiobooks.filter((b) => !b.categoria_id);

  return (
    <Layout>
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl mx-auto space-y-6 pb-32">
        {/* Header */}
        <motion.div variants={item}>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 mb-4 -ml-2 text-muted-foreground"
            onClick={() => {
              if (selectedCategory) {
                setSelectedCategory(null);
              } else {
                navigate("/");
              }
            }}
          >
            <ArrowLeft className="h-4 w-4" /> {selectedCategory ? "Categorias" : "Voltar"}
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              {selectedCategory ? (
                <span className="text-lg">{selectedCategory.icone}</span>
              ) : (
                <Headphones className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono">
                {selectedCategory ? selectedCategory.nome : "Audiobooks"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {selectedCategory
                  ? `${booksInCategory.length} audiobook${booksInCategory.length !== 1 ? "s" : ""}`
                  : "Escolha uma categoria para começar"}
              </p>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <motion.div variants={item} className="text-center py-12">
            <p className="text-sm text-muted-foreground font-mono">Carregando...</p>
          </motion.div>
        ) : !selectedCategory ? (
          /* ── CATEGORY GRID ── */
          <>
            {categorias.length === 0 && uncategorized.length === 0 ? (
              <motion.div variants={item} className="text-center py-12">
                <Headphones className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground font-mono">Nenhum audiobook disponível ainda</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {categorias.map((cat) => {
                  const count = audiobooks.filter((b) => b.categoria_id === cat.id).length;
                  const catBooks = audiobooks.filter((b) => b.categoria_id === cat.id);
                  const coverBook = catBooks.find((b) => b.capa_url);
                  return (
                    <motion.div
                      key={cat.id}
                      variants={item}
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedCategory(cat)}
                      className="group relative cursor-pointer rounded-2xl border border-border bg-card overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg"
                    >
                      {/* Cover image or gradient */}
                      <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                        {coverBook?.capa_url ? (
                          <img
                            src={coverBook.capa_url}
                            alt={cat.nome}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-4xl">{cat.icone}</span>
                          </div>
                        )}
                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                      </div>
                      {/* Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm">{cat.icone}</span>
                          <p className="font-mono text-sm font-semibold truncate">{cat.nome}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {count} {count === 1 ? "audiobook" : "audiobooks"}
                        </p>
                      </div>
                      {/* Arrow */}
                      <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-background/60 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="h-3.5 w-3.5 text-foreground" />
                      </div>
                    </motion.div>
                  );
                })}

                {/* Uncategorized card */}
                {uncategorized.length > 0 && (
                  <motion.div
                    variants={item}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedCategory({ id: "__uncategorized__", nome: "Outros", icone: "📚" })}
                    className="group relative cursor-pointer rounded-2xl border border-border bg-card overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg"
                  >
                    <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                      {uncategorized[0]?.capa_url ? (
                        <img
                          src={uncategorized[0].capa_url}
                          alt="Outros"
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl">📚</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm">📚</span>
                        <p className="font-mono text-sm font-semibold">Outros</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {uncategorized.length} {uncategorized.length === 1 ? "audiobook" : "audiobooks"}
                      </p>
                    </div>
                    <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-background/60 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="h-3.5 w-3.5 text-foreground" />
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </>
        ) : (
          /* ── AUDIOBOOKS LIST INSIDE CATEGORY ── */
          <>
            {(selectedCategory.id === "__uncategorized__" ? uncategorized : booksInCategory).length === 0 ? (
              <motion.div variants={item} className="text-center py-12">
                <Headphones className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground font-mono">Nenhum audiobook nesta categoria</p>
              </motion.div>
            ) : (
              <div className="grid gap-3">
                {(selectedCategory.id === "__uncategorized__" ? uncategorized : booksInCategory).map((book) => (
                  <AudiobookCard
                    key={book.id}
                    book={book}
                    isActive={selectedBook?.id === book.id}
                    isPlaying={selectedBook?.id === book.id && isPlaying}
                    progress={getBookProgress(book.id)}
                    concluido={progressos.find((p) => p.audiobook_id === book.id)?.concluido || false}
                    onPlay={() => playBook(book)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Player fixo no bottom */}
      <AnimatePresence>
        {selectedBook && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl"
          >
            <div className="max-w-2xl mx-auto px-4 py-3 space-y-2">
              <div className="flex items-center gap-3">
                {selectedBook.capa_url ? (
                  <img src={selectedBook.capa_url} alt={selectedBook.titulo} className="h-10 w-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Headphones className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono font-medium truncate">{selectedBook.titulo}</p>
                  {selectedBook.autor && <p className="text-[10px] text-muted-foreground truncate">{selectedBook.autor}</p>}
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
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
                    {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
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
    </Layout>
  );
};

interface AudiobookCardProps {
  book: Audiobook;
  isActive: boolean;
  isPlaying: boolean;
  progress: number;
  concluido: boolean;
  onPlay: () => void;
}

const AudiobookCard = ({ book, isActive, isPlaying, progress, concluido, onPlay }: AudiobookCardProps) => (
  <motion.div
    whileHover={{ y: -2, scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    onClick={onPlay}
    className={`group flex items-center gap-4 p-4 rounded-xl bg-card border cursor-pointer transition-all ${
      isActive ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"
    }`}
  >
    {book.capa_url ? (
      <img src={book.capa_url} alt={book.titulo} className="h-14 w-14 rounded-xl object-cover shrink-0" />
    ) : (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Headphones className="h-6 w-6 text-primary" />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="font-mono text-sm font-medium truncate">{book.titulo}</p>
      {book.autor && <p className="text-[10px] text-muted-foreground mt-0.5">{book.autor}</p>}
      <div className="flex items-center gap-2 mt-1.5">
        {progress > 0 && (
          <div className="flex-1 max-w-[120px] h-1 rounded-full bg-secondary/50 overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        {concluido && <span className="text-[9px] font-mono text-primary">✓ Concluído</span>}
        {book.duracao_segundos > 0 && (
          <span className="text-[10px] text-muted-foreground font-mono">{formatTime(book.duracao_segundos)}</span>
        )}
      </div>
    </div>
    <div className="shrink-0">
      {isActive && isPlaying ? (
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Pause className="h-4 w-4 text-primary" />
        </div>
      ) : (
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="h-4 w-4 text-primary ml-0.5" />
        </div>
      )}
    </div>
  </motion.div>
);

export default Audiobooks;
