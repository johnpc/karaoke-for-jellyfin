"use client";

import { QueueItem, KaraokeSession } from "@/types";
import { UserIcon } from "@heroicons/react/24/outline";

export interface NowPlayingInfoProps {
  currentSong: QueueItem;
}

export function NowPlayingInfo({ currentSong }: NowPlayingInfoProps) {
  return (
    <div className="p-4 bg-purple-900 bg-opacity-30 rounded-lg border border-purple-700">
      <h3 className="text-lg font-semibold text-white mb-2">
        Currently Playing
      </h3>
      <div className="text-gray-300">
        <p className="font-medium">{currentSong.mediaItem.title}</p>
        <p>{currentSong.mediaItem.artist}</p>
        <div className="flex items-center mt-1 text-sm text-gray-400">
          <UserIcon className="w-3 h-3 mr-1" />
          Added by {currentSong.addedBy}
        </div>
      </div>
    </div>
  );
}

export interface EmptyQueueWarningProps {
  session: KaraokeSession | null;
  pendingQueueLength: number;
}

export function EmptyQueueWarning({
  session,
  pendingQueueLength,
}: EmptyQueueWarningProps) {
  return (
    <div className="p-4 bg-yellow-900 bg-opacity-30 rounded-lg border border-yellow-700 mb-6">
      <h3 className="text-lg font-semibold text-yellow-300 mb-2">
        No Songs in Queue
      </h3>
      <p className="text-yellow-200 text-sm mb-3">
        Add songs to the queue using the mobile interface to start playback. Go
        to the main page, search for songs, and add them to the queue.
      </p>
      <div className="text-xs text-yellow-400">
        Debug: Session={session ? "Active" : "None"}, Queue=
        {session?.queue?.length || 0}, Pending={pendingQueueLength}
      </div>
    </div>
  );
}

export interface SeekBarProps {
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
}

export function SeekBar({ currentTime, duration, onSeek }: SeekBarProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
        <span data-testid="current-time">
          {Math.floor(currentTime / 60)}:
          {String(Math.floor(currentTime % 60)).padStart(2, "0")}
        </span>
        <span data-testid="total-duration">
          {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, "0")}
        </span>
      </div>
      <input
        data-testid="progress-bar"
        type="range"
        min="0"
        max={duration}
        value={currentTime}
        onChange={e => onSeek(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}
