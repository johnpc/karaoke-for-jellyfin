// SRT, VTT, and plain text parsers
import { LyricsFile, LyricsLine } from "@/types";

/**
 * Parse SRT format lyrics
 */
export function parseSRT(content: string, songId: string): LyricsFile {
  const lines: LyricsLine[] = [];
  const blocks = content.split("\n\n").filter(block => block.trim());

  for (const block of blocks) {
    const blockLines = block.trim().split("\n");
    if (blockLines.length < 3) continue;

    const timeMatch = blockLines[1].match(
      /(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/
    );
    if (timeMatch) {
      const [, startH, startM, startS, startMs, endH, endM, endS, endMs] =
        timeMatch;
      const startTime =
        (parseInt(startH) * 3600 + parseInt(startM) * 60 + parseInt(startS)) *
          1000 +
        parseInt(startMs);
      const endTime =
        (parseInt(endH) * 3600 + parseInt(endM) * 60 + parseInt(endS)) * 1000 +
        parseInt(endMs);

      const text = blockLines.slice(2).join(" ").trim();
      if (text) {
        lines.push({
          timestamp: startTime,
          text,
          duration: endTime - startTime,
        });
      }
    }
  }

  return { songId, lines, format: "srt" };
}

/**
 * Parse WebVTT format lyrics
 */
export function parseVTT(content: string, songId: string): LyricsFile {
  const lines: LyricsLine[] = [];
  const vttLines = content.split("\n");

  let i = 0;
  // Skip WEBVTT header
  while (i < vttLines.length && !vttLines[i].includes("-->")) {
    i++;
  }

  while (i < vttLines.length) {
    const line = vttLines[i].trim();
    const timeMatch = line.match(
      /(\d{2}):(\d{2})\.(\d{3}) --> (\d{2}):(\d{2})\.(\d{3})/
    );

    if (timeMatch) {
      const [, startM, startS, startMs, endM, endS, endMs] = timeMatch;
      const startTime =
        (parseInt(startM) * 60 + parseInt(startS)) * 1000 + parseInt(startMs);
      const endTime =
        (parseInt(endM) * 60 + parseInt(endS)) * 1000 + parseInt(endMs);

      i++;
      const textLines: string[] = [];
      while (
        i < vttLines.length &&
        vttLines[i].trim() &&
        !vttLines[i].includes("-->")
      ) {
        textLines.push(vttLines[i].trim());
        i++;
      }

      const text = textLines.join(" ").trim();
      if (text) {
        lines.push({
          timestamp: startTime,
          text,
          duration: endTime - startTime,
        });
      }
    } else {
      i++;
    }
  }

  return { songId, lines, format: "vtt" };
}

/**
 * Parse plain text lyrics (no timing — evenly spaced over 3 minutes)
 */
export function parsePlainText(content: string, songId: string): LyricsFile {
  const lines: LyricsLine[] = [];
  const textLines = content.split("\n").filter(line => line.trim());

  const totalDuration = 180000; // 3 minutes in ms
  const lineInterval = totalDuration / textLines.length;

  textLines.forEach((text, index) => {
    lines.push({
      timestamp: Math.round(index * lineInterval),
      text: text.trim(),
      duration: Math.round(lineInterval),
    });
  });

  return { songId, lines, format: "txt" };
}
