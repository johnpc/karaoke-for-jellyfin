// Lyrics processing and synchronization service
import {
  LyricsFile,
  LyricsLine,
  LyricsFormat,
  LyricsMetadata,
  LyricsSyncState,
} from "@/types";
import { promises as fs } from "fs";
import path from "path";

export class LyricsService {
  private lyricsCache = new Map<string, LyricsFile>();
  private syncStates = new Map<string, LyricsSyncState>();

  /**
   * Parse lyrics file content based on format
   */
  async parseLyricsFile(
    filePath: string,
    format: LyricsFormat,
  ): Promise<LyricsFile | null> {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const songId = path.basename(filePath, path.extname(filePath));

      switch (format) {
        case "lrc":
          return this.parseLRC(content, songId);
        case "srt":
          return this.parseSRT(content, songId);
        case "vtt":
          return this.parseVTT(content, songId);
        case "txt":
          return this.parsePlainText(content, songId);
        default:
          throw new Error(`Unsupported lyrics format: ${format}`);
      }
    } catch (error) {
      console.error(`Failed to parse lyrics file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Parse Jellyfin's native lyrics format
   */
  private parseJellyfinLyrics(lyricsData: any[], songId: string): LyricsFile {
    const lines: LyricsLine[] = lyricsData
      .filter((item) => item.Text && item.Text.trim()) // Filter out empty lines
      .map((item) => ({
        timestamp: Math.round(item.Start / 10000), // Convert from nanoseconds to milliseconds
        text: item.Text.trim(),
      }))
      .sort((a, b) => a.timestamp - b.timestamp); // Ensure chronological order

    return {
      songId,
      lines,
      format: "lrc", // Treat as LRC-compatible format
    };
  }
  private parseLRC(content: string, songId: string): LyricsFile {
    const lines: LyricsLine[] = [];
    const metadata: LyricsMetadata = {};

    const lrcLines = content.split("\n").filter((line) => line.trim());

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
            metadata.length = this.parseTimeToMs(value);
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
        /^\[(\d{1,2}):(\d{2})\.(\d{2})\](.*)$/,
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

  /**
   * Parse SRT format lyrics
   * Format:
   * 1
   * 00:00:10,500 --> 00:00:13,000
   * Lyrics text
   */
  private parseSRT(content: string, songId: string): LyricsFile {
    const lines: LyricsLine[] = [];
    const blocks = content.split("\n\n").filter((block) => block.trim());

    for (const block of blocks) {
      const blockLines = block.trim().split("\n");
      if (blockLines.length < 3) continue;

      const timeMatch = blockLines[1].match(
        /(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/,
      );
      if (timeMatch) {
        const [, startH, startM, startS, startMs, endH, endM, endS, endMs] =
          timeMatch;
        const startTime =
          (parseInt(startH) * 3600 + parseInt(startM) * 60 + parseInt(startS)) *
            1000 +
          parseInt(startMs);
        const endTime =
          (parseInt(endH) * 3600 + parseInt(endM) * 60 + parseInt(endS)) *
            1000 +
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

    return {
      songId,
      lines,
      format: "srt",
    };
  }

  /**
   * Parse WebVTT format lyrics
   */
  private parseVTT(content: string, songId: string): LyricsFile {
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
        /(\d{2}):(\d{2})\.(\d{3}) --> (\d{2}):(\d{2})\.(\d{3})/,
      );

      if (timeMatch) {
        const [, startM, startS, startMs, endM, endS, endMs] = timeMatch;
        const startTime =
          (parseInt(startM) * 60 + parseInt(startS)) * 1000 + parseInt(startMs);
        const endTime =
          (parseInt(endM) * 60 + parseInt(endS)) * 1000 + parseInt(endMs);

        i++;
        const textLines = [];
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

    return {
      songId,
      lines,
      format: "vtt",
    };
  }

  /**
   * Parse plain text lyrics (no timing)
   */
  private parsePlainText(content: string, songId: string): LyricsFile {
    const lines: LyricsLine[] = [];
    const textLines = content.split("\n").filter((line) => line.trim());

    // For plain text, we'll space lines evenly across a 3-minute duration
    const totalDuration = 180000; // 3 minutes in ms
    const lineInterval = totalDuration / textLines.length;

    textLines.forEach((text, index) => {
      lines.push({
        timestamp: Math.round(index * lineInterval),
        text: text.trim(),
        duration: Math.round(lineInterval),
      });
    });

    return {
      songId,
      lines,
      format: "txt",
    };
  }

  /**
   * Find lyrics file for a given song
   */
  async findLyricsFile(
    songId: string,
    searchPaths: string[],
  ): Promise<string | null> {
    const extensions = [".lrc", ".srt", ".vtt", ".txt"];

    for (const searchPath of searchPaths) {
      for (const ext of extensions) {
        const filePath = path.join(searchPath, `${songId}${ext}`);
        try {
          await fs.access(filePath);
          return filePath;
        } catch {
          // File doesn't exist, continue searching
        }
      }
    }

    return null;
  }

  /**
   * Get lyrics for a song (with caching)
   */
  async getLyrics(
    songId: string,
    searchPaths: string[] = [],
  ): Promise<LyricsFile | null> {
    // Check cache first
    if (this.lyricsCache.has(songId)) {
      return this.lyricsCache.get(songId)!;
    }

    // Extract Jellyfin item ID from song ID (format: jellyfin_<itemId>)
    const jellyfinItemId = songId.replace("jellyfin_", "");

    // First, try to get lyrics from Jellyfin
    try {
      const { getJellyfinService } = await import("@/services/jellyfin");
      const jellyfinService = getJellyfinService();

      const jellyfinLyrics = await jellyfinService.getLyrics(jellyfinItemId);
      if (jellyfinLyrics) {
        console.log("Found lyrics in Jellyfin for song:", songId);

        let lyricsFile: LyricsFile;

        // Check if it's Jellyfin's native format (array of objects)
        if (Array.isArray(jellyfinLyrics)) {
          console.log("Parsing Jellyfin native lyrics format");
          lyricsFile = this.parseJellyfinLyrics(jellyfinLyrics, songId);
        } else if (typeof jellyfinLyrics === "string") {
          console.log("Parsing string lyrics as LRC format");
          // Parse as LRC format string
          lyricsFile = this.parseLRC(jellyfinLyrics, songId);
        } else {
          console.log(
            "Unknown lyrics format from Jellyfin:",
            typeof jellyfinLyrics,
          );
          return null;
        }

        // Cache the result
        this.lyricsCache.set(songId, lyricsFile);
        return lyricsFile;
      }
    } catch (error) {
      console.error("Failed to get lyrics from Jellyfin:", error);
    }

    // Fallback: search for local lyrics files
    console.log(
      "No lyrics found in Jellyfin, searching local files for:",
      songId,
    );
    const lyricsPath = await this.findLyricsFile(songId, searchPaths);
    if (!lyricsPath) {
      console.log("No local lyrics files found for:", songId);
      return null;
    }

    // Determine format from extension
    const ext = path.extname(lyricsPath).toLowerCase();
    let format: LyricsFormat;
    switch (ext) {
      case ".lrc":
        format = "lrc";
        break;
      case ".srt":
        format = "srt";
        break;
      case ".vtt":
        format = "vtt";
        break;
      case ".txt":
        format = "txt";
        break;
      default:
        return null;
    }

    // Parse and cache
    const lyricsFile = await this.parseLyricsFile(lyricsPath, format);
    if (lyricsFile) {
      this.lyricsCache.set(songId, lyricsFile);
    }

    return lyricsFile;
  }

  /**
   * Create sync state for a song
   */
  createSyncState(songId: string): LyricsSyncState {
    const syncState: LyricsSyncState = {
      currentLine: -1,
      currentTimestamp: 0,
      isActive: false,
    };

    this.syncStates.set(songId, syncState);
    return syncState;
  }

  /**
   * Update sync state based on current playback time
   */
  updateSyncState(songId: string, currentTime: number): LyricsSyncState | null {
    const lyricsFile = this.lyricsCache.get(songId);
    if (!lyricsFile) {
      return null;
    }

    let syncState = this.syncStates.get(songId);
    if (!syncState) {
      syncState = this.createSyncState(songId);
    }

    const currentTimeMs = currentTime * 1000;
    syncState.currentTimestamp = currentTimeMs;

    // Find current line - simple approach: find the most recent line that has passed
    let currentLineIndex = -1;

    for (let i = lyricsFile.lines.length - 1; i >= 0; i--) {
      const line = lyricsFile.lines[i];
      // Show this line if we've passed its timestamp
      if (currentTimeMs >= line.timestamp) {
        currentLineIndex = i;
        break;
      }
    }

    // Apply a small offset to show the line slightly earlier (500ms ahead)
    if (currentLineIndex === -1) {
      const lookAheadMs = 500;
      for (let i = lyricsFile.lines.length - 1; i >= 0; i--) {
        const line = lyricsFile.lines[i];
        if (currentTimeMs + lookAheadMs >= line.timestamp) {
          currentLineIndex = i;
          break;
        }
      }
    }

    syncState.currentLine = currentLineIndex;
    syncState.isActive = currentLineIndex >= 0;

    // Set next line
    if (
      currentLineIndex >= 0 &&
      currentLineIndex < lyricsFile.lines.length - 1
    ) {
      syncState.nextLine = lyricsFile.lines[currentLineIndex + 1];
    } else {
      syncState.nextLine = undefined;
    }

    this.syncStates.set(songId, syncState);
    return syncState;
  }

  /**
   * Get current lyrics line for display
   */
  getCurrentLine(songId: string): LyricsLine | null {
    const lyricsFile = this.lyricsCache.get(songId);
    const syncState = this.syncStates.get(songId);

    if (!lyricsFile || !syncState || syncState.currentLine < 0) {
      return null;
    }

    return lyricsFile.lines[syncState.currentLine] || null;
  }

  /**
   * Clear cache and sync states
   */
  clearCache(): void {
    this.lyricsCache.clear();
    this.syncStates.clear();
  }

  /**
   * Helper function to parse time string to milliseconds
   */
  private parseTimeToMs(timeStr: string): number {
    const parts = timeStr.split(":");
    if (parts.length === 2) {
      const [minutes, seconds] = parts;
      return (parseInt(minutes) * 60 + parseFloat(seconds)) * 1000;
    }
    return 0;
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
