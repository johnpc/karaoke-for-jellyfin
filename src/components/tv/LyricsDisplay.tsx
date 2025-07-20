"use client";

import { useEffect, useState } from "react";
import { QueueItem, PlaybackState } from "@/types";
import { MusicalNoteIcon, UserIcon } from "@heroicons/react/24/outline";
import { useLyrics } from "@/hooks/useLyrics";

interface LyricsDisplayProps {
  song: QueueItem;
  playbackState: PlaybackState | null;
  isConnected: boolean;
}

export function LyricsDisplay({
  song,
  playbackState,
  isConnected,
}: LyricsDisplayProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Use the lyrics hook for lyrics functionality
  const {
    lyricsFile,
    syncState,
    currentLine,
    nextLine,
    isLoading: lyricsLoading,
    error: lyricsError,
  } = useLyrics({
    songId: song?.mediaItem?.lyricsPath,
    currentTime,
    autoSync: true,
  });

  // Debug logging
  useEffect(() => {
    console.log("LyricsDisplay - Song info:", {
      songTitle: song?.mediaItem?.title,
      lyricsPath: song?.mediaItem?.lyricsPath,
      lyricsFile: !!lyricsFile,
      lyricsLines: lyricsFile?.lines?.length,
      currentLine,
      nextLine,
      lyricsLoading,
      lyricsError,
      currentTime,
    });
  }, [
    song,
    lyricsFile,
    currentLine,
    nextLine,
    lyricsLoading,
    lyricsError,
    currentTime,
  ]);

  // Update local state from playback state (real audio timing)
  useEffect(() => {
    if (playbackState) {
      setCurrentTime(playbackState.currentTime);
      setIsPlaying(playbackState.isPlaying);
    }
  }, [playbackState]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const progress =
    song.mediaItem.duration > 0
      ? (currentTime / song.mediaItem.duration) * 100
      : 0;

  return (
    <div className="min-h-screen flex flex-col p-8 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
          }}
        ></div>
      </div>

      {/* Song Info Header - De-emphasized */}
      <div className="text-center mb-4 z-10 flex-shrink-0">
        <div className="flex items-center justify-center mb-3">
          <MusicalNoteIcon className="w-5 h-5 text-purple-400 mr-2 opacity-70" />
          <span className="text-lg text-purple-400 font-medium opacity-70">
            Now Playing
          </span>
        </div>

        <h1 className="text-3xl font-semibold mb-2 text-white leading-tight">
          {song.mediaItem.title}
        </h1>

        <p className="text-xl text-gray-400 mb-1">{song.mediaItem.artist}</p>

        {song.mediaItem.album && (
          <p className="text-sm text-gray-500 opacity-60">{song.mediaItem.album}</p>
        )}

        <div className="flex items-center justify-center mt-2 text-sm text-gray-500">
          <UserIcon className="w-4 h-4 mr-1 opacity-60" />
          <span className="opacity-60">Added by {song.addedBy}</span>
        </div>
      </div>

      {/* Lyrics Display - Enhanced prominence */}
      <div className="text-center z-10 max-w-5xl mx-auto flex-1 flex flex-col justify-center">
        <div className="mb-8">
          <div className="text-6xl font-bold text-white leading-relaxed mb-6 min-h-[160px] flex items-center justify-center px-4">
            {currentLine}
          </div>

          {nextLine && (
            <div className="text-3xl text-gray-400 opacity-70 leading-relaxed">{nextLine}</div>
          )}
        </div>

        {/* Error or loading states */}
        {lyricsError && (
          <div className="text-2xl text-red-400 italic">{lyricsError}</div>
        )}

        {!song.mediaItem.lyricsPath && !lyricsError && (
          <div className="text-3xl text-gray-500 italic">
            No lyrics available - Enjoy the music!
          </div>
        )}

        {/* Lyrics loading indicator */}
        {song.mediaItem.lyricsPath && lyricsLoading && !lyricsError && (
          <div className="text-2xl text-gray-400 italic animate-pulse">
            Loading lyrics...
          </div>
        )}

        {/* Lyrics metadata display */}
        {lyricsFile?.metadata && (
          <div className="text-xs text-gray-600 mt-6 opacity-50">
            {lyricsFile.metadata.creator && (
              <p>Lyrics by: {lyricsFile.metadata.creator}</p>
            )}
            {lyricsFile.format && (
              <p>Format: {lyricsFile.format.toUpperCase()}</p>
            )}
          </div>
        )}
      </div>

      {/* Bottom section with progress and status */}
      <div className="flex-shrink-0 z-10">
        {/* Progress Bar - Moved to bottom and simplified */}
        <div className="w-full max-w-4xl mx-auto mb-4">
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatDuration(song.mediaItem.duration)}</span>
          </div>
        </div>

        {/* Playback Status - Simplified and moved to bottom */}
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

          {/* Lyrics sync status */}
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

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500 rounded-full opacity-10 animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-blue-500 rounded-full opacity-10 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 right-1/3 w-16 h-16 bg-pink-500 rounded-full opacity-10 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>
    </div>
  );
}
