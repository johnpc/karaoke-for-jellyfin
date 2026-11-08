// Jellyfin native lyrics format parser ({Start, Text, Cues?} objects)
import { LyricsFile, LyricsLine } from "@/types";

import {
  JellyfinLyricsCue,
  parseWordTiming,
  wordsFromJellyfinCues,
} from "./word-timing";

export interface JellyfinLyricsItem {
  Start: number; // 100ns ticks
  Text: string;
  Cues?: JellyfinLyricsCue[] | null; // word timing, Jellyfin 10.11+
}

function toLyricsLine(item: JellyfinLyricsItem): LyricsLine {
  const timestamp = Math.round(item.Start / 10000); // ticks to milliseconds

  // Inline <mm:ss.xx> tags (raw Enhanced LRC passed through unparsed)
  const inline = parseWordTiming(item.Text, timestamp);
  if (inline.words) {
    return { timestamp, text: inline.text, words: inline.words };
  }

  // Structured cues (Jellyfin strips the tags and exposes them as Cues)
  const words = wordsFromJellyfinCues(item.Text, item.Cues);
  return {
    timestamp,
    text: inline.text,
    ...(words.length > 0 && { words }),
  };
}

/**
 * Parse Jellyfin's native lyrics format (array of {Start, Text} objects)
 */
export function parseJellyfinLyrics(
  lyricsData: JellyfinLyricsItem[],
  songId: string
): LyricsFile {
  const lines: LyricsLine[] = lyricsData
    .filter(item => item.Text && item.Text.trim())
    .map(toLyricsLine)
    .sort((a, b) => a.timestamp - b.timestamp);

  return {
    songId,
    lines,
    format: "lrc", // Treat as LRC-compatible format
  };
}
