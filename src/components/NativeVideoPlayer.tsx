import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { Film } from "lucide-react";

interface NativeVideoPlayerProps {
  src: string;
  /** Cloudflare Worker proxy URL for HTTP→HTTPS conversion (web only) */
  proxyUrl?: string;
  autoPlay?: boolean;
  title?: string;
}

/**
 * Video player adaptativo:
 * - Android nativo → CapacitorVideoPlayer.initPlayer() com ExoPlayer fullscreen (sem Cast)
 * - Web / fallback  → <video> HTML5
 *
 * O Cast SDK é excluído via gradle (veja instruções no README).
 */
export default function NativeVideoPlayer({
  src,
  proxyUrl = "https://bold-block-8917.denysouzah7.workers.dev",
  autoPlay = true,
  title = "",
}: NativeVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isNative = Capacitor.isNativePlatform();

  // ── Native: ExoPlayer fullscreen via @capgo/capacitor-video-player ──
  useEffect(() => {
    if (!isNative || !src) return;

    let active = true;

    const play = async () => {
      try {
        const { VideoPlayer } = await import("@capgo/capacitor-video-player");
        if (!active) return;

        await VideoPlayer.initPlayer({
          mode: "fullscreen",
          url: src,
          playerId: "fullscreen",
          componentTag: "app-video",
          title,
          smallTitle: "",
          accentColor: "#7c3aed",
          exitOnEnd: false,
          loopOnEnd: false,
          showControls: true,
          displayMode: "all",
          rate: 1,
          pipEnabled: false,
          bkmodeEnabled: false,
          chromecast: false,   // ← desabilita Cast SDK, sem crash
        });
      } catch (err) {
        console.error("[NativeVideoPlayer] initPlayer error:", err);
      }
    };

    play();
    return () => { active = false; };
  }, [src, isNative]);

  // ── Web: HTML5 <video> with optional proxy for HTTP urls ──
  if (!isNative) {
    const isHttp = src.startsWith("http://");
    const finalSrc = isHttp ? `${proxyUrl}?url=${encodeURIComponent(src)}` : src;

    if (!src) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-2 bg-black">
          <Film className="h-8 w-8 text-white/20" />
          <p className="text-white/30 text-xs font-mono">Nenhum link disponível</p>
        </div>
      );
    }

    return (
      <video
        ref={videoRef}
        key={finalSrc}
        src={finalSrc}
        controls
        autoPlay={autoPlay}
        playsInline
        controlsList="nodownload"
        className="w-full h-full object-contain bg-black"
      />
    );
  }

  // ── Native: show poster while ExoPlayer fullscreen opens ──
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 bg-black">
      <Film className="h-10 w-10 text-white/20" />
      <p className="text-xs font-mono text-white/40">Abrindo player nativo...</p>
    </div>
  );
}
