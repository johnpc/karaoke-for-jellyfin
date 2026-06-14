// LRC format parser and time utilities
import { LyricsFile, LyricsLine, LyricsMetadata } from "@/types";

/**
 * Parse time string (mm:ss.xx or mm:ss) to milliseconds
 */
export function parseTimeToMs(timeStr: string): number {
  const parts = timeStr.split(":");
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return (parseInt(minutes) * 60 + parseFloat(seconds)) * 1000;
  }
  return 0;
}

/**
 * Parse LRC format lyrics
 */
export function parseLRC(content: string, songId: string): LyricsFile {
  const lines: LyricsLine[] = [];
  const metadata: LyricsMetadata = {};

  const lrcLines = content.split("\n").filter(line => line.trim());

  for (const line of lrcLines) {
    const trimmedLine = line.trim();

    // Parse metadata tags
    const metadataMatch = trimmedLine.match(/^\[(\w+):(.+)\]$/);
    if (metadataMatch) {
      const [, tag, value] = metadataMatch;
      switch (tag.toLowerCase()) {
        case "ti":
          metadata.title = value;
          break;
        case "ar":
          metadata.artist = value;
          break;
        case "al":
          metadata.album = value;
          break;
        case "length":
          metadata.length = parseTimeToMs(value);
          break;
        case "offset":
          metadata.offset = parseInt(value);
          break;
        case "by":
          metadata.creator = value;
          break;
        case "ve":
          metadata.version = value;
          break;
      }
      continue;
    }

    // Parse timed lyrics
    const lyricsMatch = trimmedLine.match(
      /^\[(\d{1,2}):(\d{2})\.(\d{2})\](.*)$/
    );
    if (lyricsMatch) {
      const [, minutes, seconds, centiseconds, text] = lyricsMatch;
      const timestamp =
        (parseInt(minutes) * 60 + parseInt(seconds)) * 1000 +
        parseInt(centiseconds) * 10;

      if (text.trim()) {
        lines.push({
          timestamp,
          text: text.trim(),
          isChorus:
            text.toLowerCase().includes("chorus") ||
            text.toLowerCase().includes("refrain"),
          isVerse: text.toLowerCase().includes("verse"),
        });
      }
    }
  }

  // Sort lines by timestamp
  lines.sort((a, b) => a.timestamp - b.timestamp);

  // Calculate durations
  for (let i = 0; i < lines.length - 1; i++) {
    lines[i].duration = lines[i + 1].timestamp - lines[i].timestamp;
  }

  return {
    songId,
    lines,
    format: "lrc",
    metadata,
  };
}
