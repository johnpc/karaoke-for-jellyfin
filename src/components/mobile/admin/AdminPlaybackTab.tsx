"use client";

import { QueueItem, PlaybackState, PlaybackCommand } from "@/types";
import { AdminPlaybackControls } from "./AdminPlaybackControls";
import { AdminLyricsOffset } from "./AdminLyricsOffset";

interface AdminPlaybackTabProps {
  currentSong: QueueItem | null;
  playbackState: PlaybackState | null;
  pendingQueueLength: number;
  onSkip: () => void;
  onPlaybackControl: (command: PlaybackCommand) => void;
}

export function AdminPlaybackTab({
  currentSong,
  playbackState,
  pendingQueueLength,
  onSkip,
  onPlaybackControl,
}: AdminPlaybackTabProps) {
  return (
    <div className="space-y-6">
      {currentSong && (
        <div
          data-testid="current-song-info"
          className="bg-white rounded-lg p-4 shadow-sm border"
        >
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Now Playing
          </h3>
          <p className="font-semibold text-gray-900">
            {currentSong.mediaItem.title}
          </p>
          <p className="text-gray-600">{currentSong.mediaItem.artist}</p>
          <p className="text-xs text-gray-500 mt-1">
            Added by {currentSong.addedBy}
          </p>
        </div>
      )}

      <AdminPlaybackControls
        currentSong={currentSong}
        playbackState={playbackState}
        pendingQueueLength={pendingQueueLength}
        onSkip={onSkip}
        onPlaybackControl={onPlaybackControl}
      />

      <AdminLyricsOffset
        playbackState={playbackState}
        onPlaybackControl={onPlaybackControl}
      />
    </div>
  );
}
