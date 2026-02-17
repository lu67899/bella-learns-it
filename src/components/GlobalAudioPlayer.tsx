import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Headphones, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ChevronDown, Maximize2, List, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useLocation } from "react-router-dom";

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export function GlobalAudioPlayer() {
  const {
    playingCapitulo, playingBook, isPlaying, currentTime, duration,
    volume, muted, playerExpanded, showChapterList, favoritos, playingBookCaps,
    setPlayerExpanded, setShowChapterList,
    playCapitulo, togglePlay, seek, skip, handleVolume, toggleMute,
    toggleFavorite, getCapProgress,
  } = useAudioPlayer();
  const location = useLocation();
  const isAudiobooksPage = location.pathname === "/audiobooks";
  const [discHovered, setDiscHovered] = useState(false);

  if (!playingCapitulo) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Mini Player */}
      <AnimatePresence>
        {!playerExpanded && (
          isAudiobooksPage ? (
            /* Full mini-player on audiobooks page */
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t border-border bg-card/95 shadow-2xl"
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
          ) : (
            /* Floating disc on other pages */
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="fixed bottom-6 right-6 z-50"
              onMouseEnter={() => setDiscHovered(true)}
              onMouseLeave={() => setDiscHovered(false)}
            >
              {/* Glow ring */}
              <div className="absolute -inset-1 rounded-full bg-primary/20 blur-md animate-pulse" />

              {/* Progress ring SVG */}
              <svg className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] -rotate-90" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="27" fill="none" stroke="hsl(var(--primary)/0.15)" strokeWidth="2.5" />
                <circle
                  cx="30" cy="30" r="27" fill="none"
                  stroke="hsl(var(--primary))" strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 27}`}
                  strokeDashoffset={`${2 * Math.PI * 27 * (1 - progressPercent / 100)}`}
                  className="transition-all duration-300"
                />
              </svg>

              {/* Disc button */}
              <motion.button
                onClick={() => setPlayerExpanded(true)}
                className="relative h-14 w-14 rounded-full overflow-hidden shadow-lg shadow-primary/20 border-2 border-primary/30"
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={{ 
                  rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                }}
              >
                {playingBook?.capa_url ? (
                  <img src={playingBook.capa_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                    <Headphones className="h-6 w-6 text-primary" />
                  </div>
                )}
              </motion.button>

              {/* Play/Pause overlay on hover */}
              <AnimatePresence>
                {discHovered && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                    className="absolute inset-0 m-auto h-14 w-14 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center z-10"
                  >
                    {isPlaying ? <Pause className="h-5 w-5 text-primary" /> : <Play className="h-5 w-5 text-primary ml-0.5" />}
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )
        )}
      </AnimatePresence>

      {/* Expanded Full-Screen Player */}
      <AnimatePresence>
        {playerExpanded && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[100] flex flex-col bg-background"
          >
            {playingBook?.capa_url && (
              <div className="absolute inset-0 overflow-hidden">
                <img src={playingBook.capa_url} alt="" className="w-full h-full object-cover opacity-10 blur-3xl scale-110" />
                <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/90 to-background" />
              </div>
            )}

            <div className="relative flex-1 flex flex-col max-w-lg mx-auto w-full px-6">
              <div className="flex items-center justify-between py-4 pt-6">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setPlayerExpanded(false); setShowChapterList(false); }}>
                  <ChevronDown className="h-5 w-5" />
                </Button>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Reproduzindo</p>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowChapterList(!showChapterList)}>
                  <List className="h-5 w-5" />
                </Button>
              </div>

              <AnimatePresence mode="wait">
                {showChapterList ? (
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
                            onClick={() => playCapitulo(cap, playingBookCaps, playingBook!)}
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
                  <motion.div
                    key="player"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="flex-1 flex flex-col items-center justify-center gap-6"
                  >
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

                    <div className="text-center w-full px-4">
                      <h2 className="text-lg font-bold font-mono truncate">{playingCapitulo.titulo}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{playingBook?.titulo}</p>
                      {playingBook?.autor && <p className="text-xs text-muted-foreground/70 mt-0.5">{playingBook.autor}</p>}
                    </div>

                    <div className="w-full space-y-1">
                      <Slider value={[currentTime]} max={duration || 1} step={1} onValueChange={seek} className="w-full" />
                      <div className="flex justify-between">
                        <span className="text-[10px] font-mono text-muted-foreground">{formatTime(currentTime)}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">-{formatTime(Math.max(0, duration - currentTime))}</span>
                      </div>
                    </div>

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
    </>
  );
}
