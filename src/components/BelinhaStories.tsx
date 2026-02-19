import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Story {
  id: string;
  image_url: string;
  texto: string | null;
  tipo: string;
  created_at: string;
}

interface BelinhaStoriesProps {
  open: boolean;
  onClose: () => void;
}

export function useBelinhaStories() {
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    supabase
      .from("belinha_stories")
      .select("*")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setStories(data as any);
      });
  }, []);

  return { stories, hasStories: stories.length > 0 };
}

export function StoryRing({
  avatarUrl,
  hasStories,
  onClick,
  size = "lg",
}: {
  avatarUrl: string | null;
  hasStories: boolean;
  onClick: () => void;
  size?: "sm" | "lg";
}) {
  const dims = size === "lg" ? "h-12 w-12" : "h-7 w-7";
  const ringSize = size === "lg" ? "h-14 w-14" : "h-9 w-9";
  const iconDims = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";

  return (
    <button
      onClick={onClick}
      className={`${ringSize} rounded-full p-[2.5px] shrink-0 transition-transform hover:scale-105 ${
        hasStories
          ? "bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600"
          : "bg-border"
      }`}
    >
      <div className={`${ringSize} rounded-full bg-background p-[2px] flex items-center justify-center`}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Bellinha"
            className={`${dims} rounded-full object-cover`}
          />
        ) : (
          <div className={`${dims} rounded-full bg-primary/20 flex items-center justify-center`}>
            <span className={`${iconDims} text-primary`}>🤖</span>
          </div>
        )}
      </div>
    </button>
  );
}

export function BelinhaStoriesViewer({ open, onClose }: BelinhaStoriesProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(5000);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) return;
    supabase
      .from("belinha_stories")
      .select("*")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setStories(data as any);
        setCurrent(0);
        setProgress(0);
      });
  }, [open]);

  const story = stories[current];

  const next = useCallback(() => {
    if (current < stories.length - 1) {
      setCurrent((c) => c + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [current, stories.length, onClose]);

  const prev = useCallback(() => {
    if (current > 0) {
      setCurrent((c) => c - 1);
      setProgress(0);
    }
  }, [current]);

  // Auto-advance timer
  useEffect(() => {
    if (!open || stories.length === 0) return;
    const isVideo = story?.tipo === "video";
    const duration = isVideo ? videoDuration : 5000; // 5s for images
    const intervalMs = 50;
    const increment = (intervalMs / duration) * 100;

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          next();
          return 0;
        }
        return p + increment;
      });
    }, intervalMs);
    return () => clearInterval(interval);
  }, [open, stories.length, next, story?.tipo, videoDuration]);

  // Handle video duration
  const handleVideoLoaded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const dur = e.currentTarget.duration;
    if (dur && isFinite(dur)) {
      setVideoDuration(dur * 1000);
    }
  };

  if (!open || stories.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-100"
                style={{
                  width: i < current ? "100%" : i === current ? `${progress}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Close & Sound controls */}
        <div className="absolute top-8 right-3 z-10 flex items-center gap-3">
          {story.tipo === "video" && (
            <button
              onClick={() => {
                setIsMuted((m) => !m);
                if (videoRef.current) videoRef.current.muted = !videoRef.current.muted;
              }}
              className="text-white/80 hover:text-white"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          )}
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        {story.tipo === "video" ? (
          <video
            ref={videoRef}
            key={story.id}
            src={story.image_url}
            autoPlay
            muted={isMuted}
            playsInline
            onLoadedMetadata={handleVideoLoaded}
            className="max-h-[85vh] max-w-full object-contain rounded-lg"
          />
        ) : (
          <img
            key={story.id}
            src={story.image_url}
            alt=""
            className="max-h-[85vh] max-w-full object-contain rounded-lg"
          />
        )}

        {/* Text overlay */}
        {story.texto && (
          <div className="absolute bottom-12 left-4 right-4 text-center">
            <p className="text-white text-sm bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 inline-block">
              {story.texto}
            </p>
          </div>
        )}

        {/* Navigation areas */}
        <button
          onClick={prev}
          className="absolute left-0 top-0 bottom-0 w-1/3 z-[5]"
          aria-label="Anterior"
        />
        <button
          onClick={next}
          className="absolute right-0 top-0 bottom-0 w-2/3 z-[5]"
          aria-label="Próximo"
        />
      </motion.div>
    </AnimatePresence>
  );
}
