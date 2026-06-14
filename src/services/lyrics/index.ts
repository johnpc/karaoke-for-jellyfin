export { LyricsService, getLyricsService } from "./service";
export { parseLRC, parseTimeToMs } from "./parse-lrc";
export {
  parseJellyfinLyrics,
  parseSRT,
  parseVTT,
  parsePlainText,
} from "./parse-timed";
export { createSyncState, updateSyncState, getCurrentLine } from "./sync";
export {
  parseLyricsFile,
  findLyricsFile,
  formatFromExtension,
} from "./file-reader";
