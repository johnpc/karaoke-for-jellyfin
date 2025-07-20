// React hook for lyrics functionality
import { useState, useEffect, useCallback } from "react";
import { LyricsFile, LyricsSyncState, ApiResponse } from "@/types";

interface UseLyricsOptions {
  songId?: string;
  currentTime?: number;
  autoSync?: boolean;
}

interface UseLyricsReturn {
  lyricsFile: LyricsFile | null;
  syncState: LyricsSyncState | null;
  currentLine: string;
  nextLine: string;
  isLoading: boolean;
  error: string | null;
  loadLyrics: (songId: string) => Promise<void>;
  syncLyrics: (songId: string, time: number) => Promise<void>;
  clearLyrics: () => void;
}

export function useLyrics(options: UseLyricsOptions = {}): UseLyricsReturn {
  const { songId, currentTime, autoSync = true } = options;

  const [lyricsFile, setLyricsFile] = useState<LyricsFile | null>(null);
  const [syncState, setSyncState] = useState<LyricsSyncState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load lyrics when songId changes
  useEffect(() => {
    console.log("useLyrics - songId changed:", songId);
    if (songId) {
      loadLyrics(songId);
    } else {
      clearLyrics();
    }
  }, [songId]);

  // Auto-sync when time changes
  useEffect(() => {
    if (autoSync && songId && currentTime !== undefined && lyricsFile) {
      syncLyrics(songId, currentTime);
    }
  }, [autoSync, songId, currentTime, lyricsFile]);

  const loadLyrics = useCallback(async (targetSongId: string) => {
    if (!targetSongId) return;

    console.log("useLyrics - Loading lyrics for:", targetSongId);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/lyrics/${encodeURIComponent(targetSongId)}`,
      );
      const result: ApiResponse<LyricsFile> = await response.json();

      console.log("useLyrics - Lyrics API response:", result);

      if (result.success && result.data) {
        console.log(
          "useLyrics - Lyrics loaded successfully:",
          result.data.lines?.length,
          "lines",
        );
        setLyricsFile(result.data);
      } else {
        console.log("useLyrics - No lyrics found:", result.error?.message);
        setLyricsFile(null);
        setError(result.error?.message || "Failed to load lyrics");
      }
    } catch (err) {
      console.error("Failed to load lyrics:", err);
      setLyricsFile(null);
      setError("Failed to load lyrics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncLyrics = useCallback(async (targetSongId: string, time: number) => {
    if (!targetSongId || time < 0) return;

    try {
      const response = await fetch(
        `/api/lyrics/${encodeURIComponent(targetSongId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ currentTime: time }),
        },
      );

      const result: ApiResponse<LyricsSyncState> = await response.json();

      if (result.success && result.data) {
        setSyncState(result.data);
      }
    } catch (err) {
      console.error("Failed to sync lyrics:", err);
    }
  }, []);

  const clearLyrics = useCallback(() => {
    setLyricsFile(null);
    setSyncState(null);
    setError(null);
    setIsLoading(false);
  }, []);

  // Get current line text
  const currentLine = (() => {
    if (!lyricsFile || !syncState || syncState.currentLine < 0) {
      return "♪ Instrumental ♪";
    }

    const line = lyricsFile.lines[syncState.currentLine];
    return line?.text || "♪ Instrumental ♪";
  })();

  // Get next line text
  const nextLine = (() => {
    if (!syncState?.nextLine) {
      return "";
    }

    return syncState.nextLine.text;
  })();

  return {
    lyricsFile,
    syncState,
    currentLine,
    nextLine,
    isLoading,
    error,
    loadLyrics,
    syncLyrics,
    clearLyrics,
  };
}
