"use client";

import { SpeakerWaveIcon } from "@heroicons/react/24/outline";
import { QueueItem, PlaybackState, PlaybackCommand } from "@/types";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

export interface AudioPlayerProps {
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
  const { audioRef, error, needsUserGesture, startPlaybackFromGesture } =
    useAudioPlayer({
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

      {needsUserGesture && (
        <button
          type="button"
          data-testid="audio-unlock"
          onClick={startPlaybackFromGesture}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white cursor-pointer"
        >
          <SpeakerWaveIcon className="w-24 h-24 mb-6 text-purple-300" />
          <span className="text-4xl font-bold mb-3">Tap to start audio</span>
          <span className="text-xl text-gray-300">
            This browser only plays sound after you tap the screen once
          </span>
        </button>
      )}

      {error && !needsUserGesture && (
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
