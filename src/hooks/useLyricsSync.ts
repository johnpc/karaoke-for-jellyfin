"use client";

import { useEffect, useState } from "react";
import { LyricsWord, PlaybackState } from "@/types";
import { useLyrics } from "@/hooks/useLyrics";

interface UseLyricsSyncOptions {
  lyricsPath: string | undefined;
  playbackState: PlaybackState | null;
  duration: number;
}

interface UseLyricsSyncReturn {
  currentLine: string;
  currentLineWords?: LyricsWord[]; // word-level timing (Enhanced LRC)
  currentLineEndMs?: number; // start of the next line, if any
  nextLine: string;
  lyricsLoading: boolean;
  lyricsError: string | null;
  lyricsFile: ReturnType<typeof useLyrics>["lyricsFile"];
  syncState: ReturnType<typeof useLyrics>["syncState"];
  currentTime: number;
  isPlaying: boolean;
  progress: number;
}

export function useLyricsSync({
  lyricsPath,
  playbackState,
  duration,
}: UseLyricsSyncOptions): UseLyricsSyncReturn {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const {
    lyricsFile,
    syncState,
    currentLine,
    nextLine,
    isLoading: lyricsLoading,
    error: lyricsError,
  } = useLyrics({
    songId: lyricsPath,
    currentTime,
    autoSync: true,
  });

  // Update local state from playback state (real audio timing)
  useEffect(() => {
    if (playbackState) {
      const offsetTime =
        playbackState.currentTime + (playbackState.lyricsOffset || 0);
      setCurrentTime(offsetTime);
      setIsPlaying(playbackState.isPlaying);
    }
  }, [playbackState]);

  const progress =
    duration > 0 ? ((playbackState?.currentTime || 0) / duration) * 100 : 0;

  const activeLine =
    lyricsFile && syncState && syncState.currentLine >= 0
      ? lyricsFile.lines[syncState.currentLine]
      : undefined;

  return {
    currentLine,
    currentLineWords: activeLine?.words,
    currentLineEndMs: syncState?.nextLine?.timestamp,
    nextLine,
    lyricsLoading,
    lyricsError,
    lyricsFile,
    syncState,
    currentTime,
    isPlaying,
    progress,
  };
}
