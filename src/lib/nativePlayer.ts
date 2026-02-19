import { isNativeApp } from "./xtreamClient";

/**
 * Opens the native video player (ExoPlayer on Android, AVPlayer on iOS).
 * Falls back to returning false if not available.
 */
export async function playWithNativePlayer(url: string, title?: string): Promise<boolean> {
  if (!isNativeApp()) return false;

  try {
    const { VideoPlayer } = await import("@capgo/capacitor-video-player");

    await VideoPlayer.initPlayer({
      mode: "fullscreen",
      url,
      playerId: "native-player",
      componentTag: "app-player",
      title: title || "Reproduzindo",
      smallTitle: " ",
      displayMode: "landscape",
      exitOnEnd: true,
      pipEnabled: true,
      bkmodeEnabled: false,
      showControls: true,
    });

    return true;
  } catch (err) {
    console.error("[NativePlayer] Failed to open native player:", err);
    return false;
  }
}
