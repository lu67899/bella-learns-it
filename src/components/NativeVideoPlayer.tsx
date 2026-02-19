import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

interface NativeVideoPlayerProps {
  src: string;
  /** Cloudflare Worker proxy URL for HTTP→HTTPS conversion */
  proxyUrl?: string;
  autoPlay?: boolean;
}

/**
 * Robust in-app video player that works inside Capacitor's Android WebView.
 *
 * Strategy:
 *  1. If the URL is HLS (.m3u8) → use hls.js (supports adaptive streams, ts segments)
 *  2. If the URL is a direct file (mp4, mkv, ts, webm) → use native <video> src
 *  3. HTTP URLs are proxied through Cloudflare Worker to avoid mixed-content blocks
 *
 * No external plugins required → no crashes.
 */
export default function NativeVideoPlayer({
  src,
  proxyUrl = "https://bold-block-8917.denysouzah7.workers.dev",
  autoPlay = true,
}: NativeVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  // Determine final URL: proxy HTTP to avoid mixed-content block
  const isHttp = src.startsWith("http://");
  const finalUrl = isHttp ? `${proxyUrl}?url=${encodeURIComponent(src)}` : src;

  const isHls = /\.m3u8/i.test(src) || /\.m3u8/i.test(finalUrl);

  useEffect(() => {
    if (!src) return;
    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setError(null);

    // Destroy any previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const onCanPlay = () => setLoading(false);
    const onError = () => {
      setLoading(false);
      setError("Não foi possível reproduzir este conteúdo.");
    };

    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("error", onError);

    if (isHls) {
      if (Hls.isSupported()) {
        // Use hls.js — handles ts segments, adaptive bitrate
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });
        hlsRef.current = hls;
        hls.loadSource(finalUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          if (autoPlay) video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_evt, data) => {
          if (data.fatal) {
            setLoading(false);
            setError("Erro ao carregar stream HLS.");
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari / iOS native HLS support
        video.src = finalUrl;
        if (autoPlay) video.play().catch(() => {});
      } else {
        setLoading(false);
        setError("HLS não suportado neste dispositivo.");
      }
    } else {
      // Direct video file (mp4, mkv, ts, webm)
      video.src = finalUrl;
      if (autoPlay) video.play().catch(() => {});
    }

    return () => {
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("error", onError);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, retryKey]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {/* Loading overlay */}
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-black/80">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-mono text-white/50">Carregando stream...</p>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-black/90 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-xs font-mono text-white/60">{error}</p>
          <button
            onClick={() => setRetryKey((k) => k + 1)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-mono font-semibold"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
          </button>
        </div>
      )}

      <video
        ref={videoRef}
        key={`${src}-${retryKey}`}
        controls
        playsInline
        autoPlay={autoPlay}
        controlsList="nodownload"
        className="w-full h-full object-contain"
        style={{ background: "black" }}
      />
    </div>
  );
}
