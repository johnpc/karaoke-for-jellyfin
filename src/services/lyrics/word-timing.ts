// Word-level lyric timing: Enhanced LRC inline tags and Jellyfin lyric cues
import { LyricsWord } from "@/types";

/**
 * Inline word time tag as used by Enhanced LRC: <mm:ss>, <mm:ss.xx>, <mm:ss.xxx>
 * (some writers use ':' instead of '.' before the fraction).
 */
const WORD_TIME_TAG_SOURCE = String.raw`<(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?>`;

/** Jellyfin 10.11+ word cue (character range into Text, times in 100ns ticks) */
export interface JellyfinLyricsCue {
  Position: number;
  EndPosition: number;
  Start: number;
  End?: number | null;
}

/**
 * Convert the captured parts of a word time tag to milliseconds.
 * The fraction is normalised so "5" → 500ms, "50" → 500ms, "500" → 500ms.
 */
export function wordTagToMs(
  minutes: string,
  seconds: string,
  fraction?: string
): number {
  const fractionMs = fraction
    ? parseInt(fraction.padEnd(3, "0").slice(0, 3), 10)
    : 0;
  return (
    (parseInt(minutes, 10) * 60 + parseInt(seconds, 10)) * 1000 + fractionMs
  );
}

/** True when the line contains at least one inline <mm:ss.xx> tag */
export function hasWordTimeTags(text: string): boolean {
  return new RegExp(WORD_TIME_TAG_SOURCE).test(text);
}

function pushSegment(words: LyricsWord[], raw: string, startMs: number): void {
  const word = raw.trim();
  if (word) {
    words.push({ word, startMs });
  }
}

/**
 * Split an LRC line body into timed segments.
 *
 * `<00:12.00>Hello <00:12.50>world` → [{Hello, 12000}, {world, 12500}]
 *
 * Text before the first tag inherits the line start time. Lines without any
 * inline tags come back as a single segment. Anything in angle brackets that
 * is not a valid time tag is kept as literal text.
 */
export function parseEnhancedLrcLine(
  text: string,
  lineStartMs: number
): LyricsWord[] {
  const tagRegex = new RegExp(WORD_TIME_TAG_SOURCE, "g");
  const words: LyricsWord[] = [];
  let segmentStart = 0;
  let segmentStartMs = lineStartMs;

  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(text)) !== null) {
    pushSegment(words, text.slice(segmentStart, match.index), segmentStartMs);
    segmentStart = match.index + match[0].length;
    segmentStartMs = wordTagToMs(match[1], match[2], match[3]);
  }
  pushSegment(words, text.slice(segmentStart), segmentStartMs);

  return words;
}

/**
 * Produce display text (tags stripped) plus word segments when the line
 * carries Enhanced LRC timing. Plain lines return trimmed text and no words,
 * so they render exactly as before.
 */
export function parseWordTiming(
  text: string,
  lineStartMs: number
): { text: string; words?: LyricsWord[] } {
  if (!hasWordTimeTags(text)) {
    return { text: text.trim() };
  }
  const words = parseEnhancedLrcLine(text, lineStartMs);
  return { text: words.map(w => w.word).join(" "), words };
}

/**
 * Map Jellyfin lyric cues (character ranges + tick timestamps) onto the line
 * text. Jellyfin strips <mm:ss.xx> tags from Text and exposes them as Cues.
 */
export function wordsFromJellyfinCues(
  text: string,
  cues: JellyfinLyricsCue[] | null | undefined
): LyricsWord[] {
  if (!cues || cues.length === 0) return [];
  const words: LyricsWord[] = [];
  const sorted = [...cues].sort((a, b) => a.Position - b.Position);
  for (const cue of sorted) {
    const raw = text.slice(cue.Position, cue.EndPosition);
    pushSegment(words, raw, Math.round(cue.Start / 10000));
  }
  return words;
}
