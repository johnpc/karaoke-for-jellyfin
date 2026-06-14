// LyricsService: caching, orchestration, and lyrics retrieval
import { LyricsFile, LyricsLine, LyricsSyncState } from "@/types";
import path from "path";

import { parseLRC } from "./parse-lrc";
import { parseJellyfinLyrics } from "./parse-timed";
import {
  findLyricsFile,
  parseLyricsFile,
  formatFromExtension,
} from "./file-reader";
import {
  createSyncState as createSync,
  updateSyncState as updateSync,
  getCurrentLine as getLine,
} from "./sync";

export class LyricsService {
  private lyricsCache = new Map<string, LyricsFile>();
  private syncStates = new Map<string, LyricsSyncState>();

  /**
   * Get lyrics for a song (with caching). Tries Jellyfin first, then local files.
   */
  async getLyrics(
    songId: string,
    searchPaths: string[] = []
  ): Promise<LyricsFile | null> {
    if (this.lyricsCache.has(songId)) {
      return this.lyricsCache.get(songId)!;
    }

    const jellyfinItemId = songId.replace("jellyfin_", "");

    // Try Jellyfin first
    try {
      const { getJellyfinService } = await import("@/services/jellyfin");
      const jellyfinService = getJellyfinService();
      const jellyfinLyrics = await jellyfinService.getLyrics(jellyfinItemId);

      if (jellyfinLyrics) {
        console.log("Found lyrics in Jellyfin for song:", songId);
        let lyricsFile: LyricsFile;

        if (Array.isArray(jellyfinLyrics)) {
          console.log("Parsing Jellyfin native lyrics format");
          lyricsFile = parseJellyfinLyrics(
            jellyfinLyrics as { Start: number; Text: string }[],
            songId
          );
        } else if (typeof jellyfinLyrics === "string") {
          console.log("Parsing string lyrics as LRC format");
          lyricsFile = parseLRC(jellyfinLyrics, songId);
        } else {
          console.log(
            "Unknown lyrics format from Jellyfin:",
            typeof jellyfinLyrics
          );
          return null;
        }

        this.lyricsCache.set(songId, lyricsFile);
        return lyricsFile;
      }
    } catch (error) {
      console.error("Failed to get lyrics from Jellyfin:", error);
    }

    // Fallback: search for local lyrics files
    console.log(
      "No lyrics found in Jellyfin, searching local files for:",
      songId
    );
    const lyricsPath = await findLyricsFile(songId, searchPaths);
    if (!lyricsPath) {
      console.log("No local lyrics files found for:", songId);
      return null;
    }

    const format = formatFromExtension(path.extname(lyricsPath));
    if (!format) return null;

    const lyricsFile = await parseLyricsFile(lyricsPath, format);
    if (lyricsFile) {
      this.lyricsCache.set(songId, lyricsFile);
    }
    return lyricsFile;
  }

  createSyncState(songId: string): LyricsSyncState {
    const syncState = createSync();
    this.syncStates.set(songId, syncState);
    return syncState;
  }

  updateSyncState(songId: string, currentTime: number): LyricsSyncState | null {
    const lyricsFile = this.lyricsCache.get(songId);
    if (!lyricsFile) return null;

    let syncState = this.syncStates.get(songId);
    if (!syncState) {
      syncState = this.createSyncState(songId);
    }

    const updated = updateSync(lyricsFile, syncState, currentTime);
    this.syncStates.set(songId, updated);
    return updated;
  }

  getCurrentLine(songId: string): LyricsLine | null {
    const lyricsFile = this.lyricsCache.get(songId);
    const syncState = this.syncStates.get(songId);
    if (!lyricsFile || !syncState) return null;
    return getLine(lyricsFile, syncState);
  }

  async findLyricsFile(
    songId: string,
    searchPaths: string[]
  ): Promise<string | null> {
    return findLyricsFile(songId, searchPaths);
  }

  async parseLyricsFile(
    filePath: string,
    format: string
  ): Promise<LyricsFile | null> {
    return parseLyricsFile(filePath, format as import("@/types").LyricsFormat);
  }

  clearCache(): void {
    this.lyricsCache.clear();
    this.syncStates.clear();
  }
}

// Singleton instance
let lyricsService: LyricsService | null = null;

export function getLyricsService(): LyricsService {
  if (!lyricsService) {
    lyricsService = new LyricsService();
  }
  return lyricsService;
}
