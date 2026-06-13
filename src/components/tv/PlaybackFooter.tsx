"use client";

import { LyricsFile, LyricsSyncState } from "@/types";
import { formatTime } from "@/utils/formatTime";

interface PlaybackFooterProps {
  progress: number;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isConnected: boolean;
  lyricsFile: LyricsFile | null;
  syncState: LyricsSyncState | null;
}

export function PlaybackFooter({
  progress,
  currentTime,
  duration,
  isPlaying,
  isConnected,
  lyricsFile,
  syncState,
}: PlaybackFooterProps) {
  return (
    <div className="flex-shrink-0 z-10">
      {/* Progress Bar */}
      <div
        data-testid="playback-progress"
        className="w-full max-w-4xl mx-auto mb-4"
      >
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            data-testid="progress-bar-fill"
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
          <span data-testid="playback-current-time">
            {formatTime(currentTime)}
          </span>
          <span data-testid="playback-duration">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback Status */}
      <div className="flex items-center justify-center space-x-4 text-sm">
        <div
          className={`flex items-center px-3 py-1 rounded-full ${
            isPlaying
              ? "bg-green-900 text-green-300"
              : "bg-yellow-900 text-yellow-300"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full mr-2 ${
              isPlaying ? "bg-green-400" : "bg-yellow-400"
            }`}
          />
          {isPlaying ? "Playing" : "Paused"}
        </div>

        <div
          className={`flex items-center px-3 py-1 rounded-full text-xs ${
            isConnected
              ? "bg-blue-900 text-blue-300"
              : "bg-red-900 text-red-300"
          }`}
        >
          {isConnected ? "Live" : "Offline"}
        </div>

        {lyricsFile && (
          <div
            className={`flex items-center px-3 py-1 rounded-full text-xs ${
              syncState?.isActive
                ? "bg-purple-900 text-purple-300"
                : "bg-gray-900 text-gray-400"
            }`}
          >
            {syncState?.isActive ? "Synced" : "Ready"}
          </div>
        )}
      </div>
    </div>
  );
}
