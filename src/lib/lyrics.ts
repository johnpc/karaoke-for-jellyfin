// Lyrics time-syncing and formatting utilities
import { LyricsLine } from "@/types";

export function findCurrentLyricsLine(
  lines: LyricsLine[],
  currentTime: number
): { current: LyricsLine | null; next: LyricsLine | null; index: number } {
  if (!lines.length) {
    return { current: null, next: null, index: -1 };
  }

  const currentTimeMs = currentTime * 1000;

  // Find the current line (last line with timestamp <= currentTime)
  let currentIndex = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].timestamp <= currentTimeMs) {
      currentIndex = i;
      break;
    }
  }

  const current = currentIndex >= 0 ? lines[currentIndex] : null;
  const next =
    currentIndex >= 0 && currentIndex < lines.length - 1
      ? lines[currentIndex + 1]
      : null;

  return { current, next, index: currentIndex };
}

export function formatLyricsTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const ms = Math.floor((milliseconds % 1000) / 10);

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}
