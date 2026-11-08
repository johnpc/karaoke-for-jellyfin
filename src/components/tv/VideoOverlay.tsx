"use client";

import { VideoCameraIcon, UserIcon } from "@heroicons/react/24/outline";
import { QueueItem, PlaybackState } from "@/types";
import { formatTime } from "@/utils/formatTime";

interface VideoOverlayProps {
  song: QueueItem;
  playbackState: PlaybackState | null;
  isConnected: boolean;
}

/**
 * Minimal chrome shown over a karaoke video: a thin progress line and a
 * compact "now playing" caption. No lyric panel — the video carries lyrics.
 * Does not touch useLyricsSync, so no lyric requests are made for videos.
 */
export function VideoOverlay({
  song,
  playbackState,
  isConnected,
}: VideoOverlayProps) {
  const currentTime = playbackState?.currentTime || 0;
  const duration = song.mediaItem.duration;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      data-testid="video-overlay"
      aria-live="polite"
      className="relative z-10 min-h-screen p-6 pointer-events-none"
    >
      <div
        data-testid="playback-progress"
        className="fixed top-0 left-0 right-0 h-1 bg-gray-800/70"
      >
        <div
          data-testid="progress-bar-fill"
          className="h-1 bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000 ease-linear"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <div className="inline-block max-w-xl rounded-xl bg-black/60 px-5 py-3 backdrop-blur-sm">
        <div className="flex items-center text-sm font-medium text-purple-300">
          <VideoCameraIcon className="mr-2 h-4 w-4" />
          Karaoke Video
          <span className="mx-2 text-gray-500">&bull;</span>
          <span className="tabular-nums text-gray-300">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          {!isConnected && <span className="ml-2 text-red-400">Offline</span>}
        </div>
        <h1
          data-testid="current-song-title"
          className="mt-1 text-2xl font-semibold leading-tight text-white"
        >
          {song.mediaItem.title}
        </h1>
        <p data-testid="current-song-artist" className="text-lg text-gray-300">
          {song.mediaItem.artist}
        </p>
        <div className="mt-1 flex items-center text-xs text-gray-400">
          <UserIcon className="mr-1 h-3 w-3" />
          Added by {song.addedBy}
        </div>
      </div>
    </div>
  );
}
