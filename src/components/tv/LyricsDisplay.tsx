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
    <div className="min-h-screen flex flex-col justify-center items-center p-8 relative">
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

      {/* Song Info Header */}
      <div className="text-center mb-12 z-10">
        <div className="flex items-center justify-center mb-4">
          <MusicalNoteIcon className="w-8 h-8 text-purple-400 mr-3" />
          <span className="text-2xl text-purple-400 font-medium">
            Now Playing
          </span>
        </div>

        <h1 className="text-6xl font-bold mb-4 text-white leading-tight">
          {song.mediaItem.title}
        </h1>

        <p className="text-3xl text-gray-300 mb-2">{song.mediaItem.artist}</p>

        {song.mediaItem.album && (
          <p className="text-xl text-gray-400">{song.mediaItem.album}</p>
        )}

        <div className="flex items-center justify-center mt-4 text-lg text-gray-400">
          <UserIcon className="w-5 h-5 mr-2" />
          Added by {song.addedBy}
        </div>
      </div>

      {/* Lyrics Display */}
      <div className="text-center mb-12 z-10 max-w-4xl">
        <div className="mb-8">
          <div className="text-5xl font-bold text-white leading-relaxed mb-4 min-h-[120px] flex items-center justify-center">
            {currentLine}
          </div>

          {nextLine && (
            <div className="text-2xl text-gray-500 opacity-60">{nextLine}</div>
          )}
        </div>

        {/* Error or loading states */}
        {lyricsError && (
          <div className="text-xl text-red-400 italic">{lyricsError}</div>
        )}

        {!song.mediaItem.lyricsPath && !lyricsError && (
          <div className="text-xl text-gray-500 italic">
            No lyrics available - Enjoy the music!
          </div>
        )}

        {/* Lyrics loading indicator */}
        {song.mediaItem.lyricsPath && lyricsLoading && !lyricsError && (
          <div className="text-xl text-gray-400 italic animate-pulse">
            Loading lyrics...
          </div>
        )}

        {/* Lyrics metadata display */}
        {lyricsFile?.metadata && (
          <div className="text-sm text-gray-500 mt-4">
            {lyricsFile.metadata.creator && (
              <p>Lyrics by: {lyricsFile.metadata.creator}</p>
            )}
            {lyricsFile.format && (
              <p>Format: {lyricsFile.format.toUpperCase()}</p>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-4xl mb-8 z-10">
        <div className="flex items-center justify-between text-lg text-gray-400 mb-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatDuration(song.mediaItem.duration)}</span>
        </div>

        <div className="w-full bg-gray-800 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Playback Status */}
      <div className="flex items-center justify-center space-x-6 text-lg z-10">
        <div
          className={`flex items-center px-4 py-2 rounded-full ${
            isPlaying
              ? "bg-green-900 text-green-300"
              : "bg-yellow-900 text-yellow-300"
          }`}
        >
          <div
            className={`w-3 h-3 rounded-full mr-2 ${
              isPlaying ? "bg-green-400" : "bg-yellow-400"
            }`}
          />
          {isPlaying ? "Playing" : "Paused"}
        </div>

        {playbackState && (
          <div className="flex items-center text-gray-400">
            <span>Volume: {playbackState.volume}%</span>
            {playbackState.isMuted && (
              <span className="ml-2 text-red-400">(Muted)</span>
            )}
          </div>
        )}

        <div
          className={`flex items-center px-3 py-1 rounded-full text-sm ${
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
            className={`flex items-center px-3 py-1 rounded-full text-sm ${
              syncState?.isActive
                ? "bg-purple-900 text-purple-300"
                : "bg-gray-900 text-gray-400"
            }`}
          >
            {syncState?.isActive ? "Lyrics Synced" : "Lyrics Ready"}
          </div>
        )}
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
