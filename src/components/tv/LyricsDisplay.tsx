"use client";

import { QueueItem, PlaybackState } from "@/types";
import { useLyricsSync } from "@/hooks/useLyricsSync";
import { SongInfoHeader } from "@/components/tv/SongInfoHeader";
import { LyricsContent } from "@/components/tv/LyricsContent";
import { PlaybackFooter } from "@/components/tv/PlaybackFooter";

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
  const {
    currentLine,
    nextLine,
    lyricsLoading,
    lyricsError,
    lyricsFile,
    syncState,
    isPlaying,
    progress,
  } = useLyricsSync({
    lyricsPath: song?.mediaItem?.lyricsPath,
    playbackState,
    duration: song.mediaItem.duration,
  });

  return (
    <div
      data-testid="lyrics-display"
      aria-live="polite"
      className="min-h-screen flex flex-col p-8 relative"
    >
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

      <SongInfoHeader song={song} />

      <LyricsContent
        currentLine={currentLine}
        nextLine={nextLine}
        lyricsError={lyricsError}
        lyricsLoading={lyricsLoading}
        lyricsFile={lyricsFile}
        hasLyricsPath={!!song.mediaItem.lyricsPath}
      />

      <PlaybackFooter
        progress={progress}
        currentTime={playbackState?.currentTime || 0}
        duration={song.mediaItem.duration}
        isPlaying={isPlaying}
        isConnected={isConnected}
        lyricsFile={lyricsFile}
        syncState={syncState}
      />

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
