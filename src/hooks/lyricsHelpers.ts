import { LyricsFile, LyricsSyncState, ApiResponse } from "@/types";

export interface UseLyricsOptions {
  songId?: string;
  currentTime?: number;
  autoSync?: boolean;
}

export interface UseLyricsReturn {
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

export async function fetchLyrics(
  targetSongId: string
): Promise<ApiResponse<LyricsFile>> {
  const response = await fetch(
    `/api/lyrics/${encodeURIComponent(targetSongId)}`
  );
  return response.json();
}

export async function fetchLyricsSync(
  targetSongId: string,
  time: number
): Promise<ApiResponse<LyricsSyncState>> {
  const response = await fetch(
    `/api/lyrics/${encodeURIComponent(targetSongId)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ currentTime: time }),
    }
  );
  return response.json();
}

export function getCurrentLineText(
  lyricsFile: LyricsFile | null,
  syncState: LyricsSyncState | null
): string {
  if (!lyricsFile || !syncState || syncState.currentLine < 0) {
    return "♪ Instrumental ♪";
  }
  const line = lyricsFile.lines[syncState.currentLine];
  return line?.text || "♪ Instrumental ♪";
}

export function getNextLineText(syncState: LyricsSyncState | null): string {
  if (!syncState?.nextLine) {
    return "";
  }
  return syncState.nextLine.text;
}
