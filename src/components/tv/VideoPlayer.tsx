"use client";

import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import type { AudioPlayerProps } from "@/components/tv/AudioPlayer";

/**
 * Full-screen <video> for karaoke videos (lyrics burned in).
 * Shares the audio player's hook, so play/pause/seek/volume/skip and the
 * ended -> next-song flow behave exactly like audio entries.
 */
export function VideoPlayer({
  song,
  playbackState,
  onSongEnded,
  onTimeUpdate,
}: AudioPlayerProps) {
  const { audioRef, error } = useAudioPlayer<HTMLVideoElement>({
    song,
    playbackState,
    onSongEnded,
    onTimeUpdate,
  });

  return (
    <>
      <video
        ref={audioRef}
        data-testid="video-player"
        aria-label="Karaoke video player"
        preload="auto"
        playsInline
        className="fixed inset-0 z-0 h-full w-full bg-black object-contain"
      />

      {error && (
        <div
          data-testid="video-error"
          className="absolute top-1/2 left-1/2 z-20 transform -translate-x-1/2 -translate-y-1/2 bg-red-900 border border-red-700 rounded-lg p-4 text-red-300"
        >
          Video Error: {error}
        </div>
      )}
    </>
  );
}
