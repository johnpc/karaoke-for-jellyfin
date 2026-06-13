"use client";

import { QueueItem, PlaybackState, PlaybackCommand } from "@/types";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

interface AudioPlayerProps {
  song: QueueItem | null;
  playbackState: PlaybackState | null;
  onPlaybackControl: (command: PlaybackCommand) => void;
  onSongEnded: () => void;
  onTimeUpdate: (currentTime: number) => void;
}

export function AudioPlayer({
  song,
  playbackState,
  onSongEnded,
  onTimeUpdate,
}: AudioPlayerProps) {
  const { audioRef, error } = useAudioPlayer({
    song,
    playbackState,
    onSongEnded,
    onTimeUpdate,
  });

  return (
    <>
      <audio
        ref={audioRef}
        data-testid="audio-player"
        aria-label="Karaoke audio player"
        preload="auto"
        style={{ display: "none" }}
      />

      {error && (
        <div
          data-testid="audio-error"
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-900 border border-red-700 rounded-lg p-4 text-red-300"
        >
          Audio Error: {error}
        </div>
      )}
    </>
  );
}
