"use client";

import { QueueItem, PlaybackState, KaraokeSession } from "@/types";
import {
  NowPlayingInfo,
  EmptyQueueWarning,
  PlaybackControls,
  SeekBar,
  VolumeControl,
} from "./PlaybackSubComponents";

interface PlaybackTabProps {
  currentSong: QueueItem | null;
  playbackState: PlaybackState | null;
  pendingQueue: QueueItem[];
  session: KaraokeSession | null;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
  onMute: () => void;
  onSkip: () => void;
}

export function PlaybackTab({
  currentSong,
  playbackState,
  pendingQueue,
  session,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onMute,
  onSkip,
}: PlaybackTabProps) {
  const isPlaying = playbackState?.isPlaying ?? false;
  const currentTime = playbackState?.currentTime ?? 0;
  const volume = playbackState?.volume ?? 80;
  const isMuted = playbackState?.isMuted ?? false;
  const isDisabled = pendingQueue.length === 0 && !currentSong;

  return (
    <div className="space-y-6">
      {currentSong && <NowPlayingInfo currentSong={currentSong} />}

      {isDisabled && (
        <EmptyQueueWarning
          session={session}
          pendingQueueLength={pendingQueue.length}
        />
      )}

      <PlaybackControls
        isPlaying={isPlaying}
        isDisabled={isDisabled}
        hasCurrentSong={!!currentSong}
        currentTime={currentTime}
        onPlayPause={onPlayPause}
        onSeek={onSeek}
        onSkip={onSkip}
      />

      {currentSong && (
        <SeekBar
          currentTime={currentTime}
          duration={currentSong.mediaItem.duration}
          onSeek={onSeek}
        />
      )}

      <VolumeControl
        volume={volume}
        isMuted={isMuted}
        onVolumeChange={onVolumeChange}
        onMute={onMute}
      />
    </div>
  );
}
