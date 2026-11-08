export { LyricsService, getLyricsService } from "./service";
export { parseLRC, parseTimeToMs } from "./parse-lrc";
export { parseJellyfinLyrics } from "./parse-jellyfin";
export type { JellyfinLyricsItem } from "./parse-jellyfin";
export { parseSRT, parseVTT, parsePlainText } from "./parse-timed";
export {
  parseEnhancedLrcLine,
  parseWordTiming,
  hasWordTimeTags,
  wordsFromJellyfinCues,
  wordTagToMs,
} from "./word-timing";
export type { JellyfinLyricsCue } from "./word-timing";
export { createSyncState, updateSyncState, getCurrentLine } from "./sync";
export {
  parseLyricsFile,
  findLyricsFile,
  formatFromExtension,
} from "./file-reader";
