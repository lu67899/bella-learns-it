import { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Media Session API helper for lock screen / notification controls
function updateMediaSession(book: { titulo: string; autor: string | null; capa_url: string | null } | null, handlers: { play?: () => void; pause?: () => void; prev?: () => void; next?: () => void }) {
  if (!("mediaSession" in navigator)) return;
  if (!book) {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = "none";
    return;
  }
  navigator.mediaSession.metadata = new MediaMetadata({
    title: book.titulo,
    artist: book.autor || "Audiobook",
    album: "Bella Space",
    artwork: book.capa_url ? [{ src: book.capa_url, sizes: "512x512", type: "image/jpeg" }] : [],
  });
  if (handlers.play) navigator.mediaSession.setActionHandler("play", handlers.play);
  if (handlers.pause) navigator.mediaSession.setActionHandler("pause", handlers.pause);
  if (handlers.prev) navigator.mediaSession.setActionHandler("previoustrack", handlers.prev);
  if (handlers.next) navigator.mediaSession.setActionHandler("nexttrack", handlers.next);
  navigator.mediaSession.setActionHandler("seekbackward", () => handlers.prev?.());
  navigator.mediaSession.setActionHandler("seekforward", () => handlers.next?.());
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
  capitulo_id: string | null;
  posicao_segundos: number;
  concluido: boolean;
}

interface AudioPlayerContextType {
  playingCapitulo: Capitulo | null;
  playingBook: Audiobook | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playerExpanded: boolean;
  showChapterList: boolean;
  favoritos: string[];
  progressos: Progresso[];
  playingBookCaps: Capitulo[];
  setPlayerExpanded: (v: boolean) => void;
  setShowChapterList: (v: boolean) => void;
  playCapitulo: (cap: Capitulo, allCaps: Capitulo[], book: Audiobook) => void;
  togglePlay: () => void;
  seek: (value: number[]) => void;
  skip: (seconds: number) => void;
  handleVolume: (value: number[]) => void;
  toggleMute: () => void;
  toggleFavorite: (bookId: string) => void;
  saveProgress: () => Promise<void>;
  setProgressos: React.Dispatch<React.SetStateAction<Progresso[]>>;
  setFavoritos: React.Dispatch<React.SetStateAction<string[]>>;
  getCapProgress: (capId: string) => { percent: number; concluido: boolean };
  stopPlayback: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  return ctx;
}

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [playingCapitulo, setPlayingCapitulo] = useState<Capitulo | null>(null);
  const [playingBook, setPlayingBook] = useState<Audiobook | null>(null);
  const [playingBookCaps, setPlayingBookCaps] = useState<Capitulo[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playerExpanded, setPlayerExpanded] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [progressos, setProgressos] = useState<Progresso[]>([]);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const saveInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load favoritos on mount
  useEffect(() => {
    if (!session?.user?.id) {
      // User logged out - stop playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      setPlayingCapitulo(null);
      setPlayingBook(null);
      setPlayingBookCaps([]);
      setIsPlaying(false);
      setFavoritos([]);
      setProgressos([]);
      return;
    }
    supabase.from("audiobook_favoritos").select("audiobook_id").then(({ data }) => {
      if (data) setFavoritos(data.map((f: any) => f.audiobook_id));
    });
  }, [session?.user?.id]);

  // Load progressos on mount
  useEffect(() => {
    if (!session?.user?.id) return;
    supabase.from("audiobook_progresso").select("audiobook_id, capitulo_id, posicao_segundos, concluido").then(({ data }) => {
      if (data) setProgressos(data);
    });
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
      if (idx >= 0) return prev.map((p, i) => (i === idx ? newP : p));
      return [...prev, newP];
    });
  }, [playingCapitulo, session?.user?.id]);

  const playCapitulo = (cap: Capitulo, allCaps: Capitulo[], book: Audiobook) => {
    if (playingCapitulo?.id === cap.id) { togglePlay(); return; }
    if (playingCapitulo) saveProgress();
    setPlayingCapitulo(cap);
    setPlayingBook(book);
    setPlayingBookCaps(allCaps);
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
      if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
    });
    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      saveProgress();
      const idx = allCaps.findIndex((c) => c.id === cap.id);
      if (idx < allCaps.length - 1) setTimeout(() => playCapitulo(allCaps[idx + 1], allCaps, book), 1000);
    });

    // Media Session: notification / lock screen controls
    const capIdx = allCaps.findIndex((c) => c.id === cap.id);
    updateMediaSession(book, {
      play: () => { audioRef.current?.play(); setIsPlaying(true); },
      pause: () => { audioRef.current?.pause(); setIsPlaying(false); },
      prev: capIdx > 0 ? () => playCapitulo(allCaps[capIdx - 1], allCaps, book) : undefined,
      next: capIdx < allCaps.length - 1 ? () => playCapitulo(allCaps[capIdx + 1], allCaps, book) : undefined,
    });
  };

  useEffect(() => {
    if (isPlaying) { saveInterval.current = setInterval(saveProgress, 15000); }
    return () => { if (saveInterval.current) clearInterval(saveInterval.current); };
  }, [isPlaying, saveProgress]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); saveProgress(); } else { audioRef.current.play(); }
    const newState = !isPlaying;
    setIsPlaying(newState);
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = newState ? "playing" : "paused";
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
    const cap = playingBookCaps.find((c) => c.id === capId);
    if (!cap || !cap.duracao_segundos) return { percent: 0, concluido: p.concluido };
    return { percent: Math.min(100, (p.posicao_segundos / cap.duracao_segundos) * 100), concluido: p.concluido };
  };

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setPlayingCapitulo(null);
    setPlayingBook(null);
    setPlayingBookCaps([]);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    updateMediaSession(null, {});
  }, []);

  return (
    <AudioPlayerContext.Provider value={{
      playingCapitulo, playingBook, isPlaying, currentTime, duration,
      volume, muted, playerExpanded, showChapterList, favoritos, progressos,
      playingBookCaps,
      setPlayerExpanded, setShowChapterList,
      playCapitulo, togglePlay, seek, skip, handleVolume, toggleMute,
      toggleFavorite, saveProgress, setProgressos, setFavoritos, getCapProgress,
      stopPlayback,
    }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}
