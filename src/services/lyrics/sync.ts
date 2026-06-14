// Lyrics synchronization state management
import { LyricsFile, LyricsLine, LyricsSyncState } from "@/types";

/**
 * Create a fresh sync state for a song
 */
export function createSyncState(): LyricsSyncState {
  return {
    currentLine: -1,
    currentTimestamp: 0,
    isActive: false,
  };
}

/**
 * Update sync state based on current playback time (in seconds)
 */
export function updateSyncState(
  lyricsFile: LyricsFile,
  syncState: LyricsSyncState,
  currentTime: number
): LyricsSyncState {
  const currentTimeMs = currentTime * 1000;
  const updated: LyricsSyncState = {
    ...syncState,
    currentTimestamp: currentTimeMs,
  };

  // Find current line — most recent line whose timestamp has passed
  let currentLineIndex = -1;

  for (let i = lyricsFile.lines.length - 1; i >= 0; i--) {
    if (currentTimeMs >= lyricsFile.lines[i].timestamp) {
      currentLineIndex = i;
      break;
    }
  }

  // Apply a small look-ahead (500ms) if no line found yet
  if (currentLineIndex === -1) {
    const lookAheadMs = 500;
    for (let i = lyricsFile.lines.length - 1; i >= 0; i--) {
      if (currentTimeMs + lookAheadMs >= lyricsFile.lines[i].timestamp) {
        currentLineIndex = i;
        break;
      }
    }
  }

  updated.currentLine = currentLineIndex;
  updated.isActive = currentLineIndex >= 0;

  // Set next line
  if (currentLineIndex >= 0 && currentLineIndex < lyricsFile.lines.length - 1) {
    updated.nextLine = lyricsFile.lines[currentLineIndex + 1];
  } else {
    updated.nextLine = undefined;
  }

  return updated;
}

/**
 * Get current lyrics line from a lyrics file given its sync state
 */
export function getCurrentLine(
  lyricsFile: LyricsFile,
  syncState: LyricsSyncState
): LyricsLine | null {
  if (syncState.currentLine < 0) {
    return null;
  }
  return lyricsFile.lines[syncState.currentLine] || null;
}
