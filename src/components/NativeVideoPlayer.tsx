import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { Film } from "lucide-react";
import { remoteLog } from "@/lib/remoteLogger";

const TAG = "[NativeVideoPlayer]";

interface NativeVideoPlayerProps {
  src: string;
  /** Cloudflare Worker proxy URL para HTTP→HTTPS (web only) */
  proxyUrl?: string;
  autoPlay?: boolean;
  title?: string;
}

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
    remoteLog.info(TAG, `src recebido: "${src}" | isNative: ${isNative}`);

    if (!isNative || !src || src.trim() === "") {
      if (isNative) remoteLog.warn(TAG, "URL vazia — initPlayer cancelado");
      return;
    }

    let active = true;

    const play = async () => {
      try {
        const { VideoPlayer } = await import("@capgo/capacitor-video-player");
        if (!active) return;

        remoteLog.info(TAG, "Iniciando ExoPlayer", { url: src });

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
          chromecast: false,
        });

        remoteLog.info(TAG, "ExoPlayer iniciado com sucesso");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        remoteLog.error(TAG, "initPlayer FALHOU", { error: msg, url: src });
      }
    };

    play();
    return () => { active = false; };
  }, [src, isNative]);

  // ── Web: HTML5 <video> com proxy opcional para HTTP ──
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

  // ── Native: poster enquanto ExoPlayer abre ──
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 bg-black">
      <Film className="h-10 w-10 text-white/20" />
      <p className="text-xs font-mono text-white/40">Abrindo player nativo...</p>
    </div>
  );
}
