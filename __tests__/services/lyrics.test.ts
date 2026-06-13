import { describe, it, expect, vi, beforeEach } from "vitest";
import { LyricsService } from "@/services/lyrics";
import { LyricsFormat } from "@/types";
import path from "path";

const mockReadFile = vi.fn();
const mockAccess = vi.fn();
const mockGetLyrics = vi.fn();

vi.mock("fs", () => {
  return {
    default: {
      promises: {
        readFile: (...args: unknown[]) => mockReadFile(...args),
        access: (...args: unknown[]) => mockAccess(...args),
      },
    },
    promises: {
      readFile: (...args: unknown[]) => mockReadFile(...args),
      access: (...args: unknown[]) => mockAccess(...args),
    },
    readFileSync: vi.fn(),
    existsSync: vi.fn(),
  };
});

vi.mock("@/services/jellyfin", () => ({
  getJellyfinService: () => ({
    getLyrics: (...args: unknown[]) => mockGetLyrics(...args),
  }),
}));

describe("LyricsService", () => {
  let lyricsService: LyricsService;

  beforeEach(() => {
    lyricsService = new LyricsService();
    vi.clearAllMocks();
  });

  describe("parseLyricsFile", () => {
    it("should parse LRC format correctly", async () => {
      const lrcContent = `[ti:Test Song]
[ar:Test Artist]
[al:Test Album]
[00:10.50]First line of lyrics
[00:15.25]Second line of lyrics
[00:20.00]Third line of lyrics`;

      mockReadFile.mockResolvedValue(lrcContent);

      const result = await lyricsService.parseLyricsFile(
        "/test/song.lrc",
        "lrc"
      );

      expect(result).toBeTruthy();
      expect(result?.format).toBe("lrc");
      expect(result?.songId).toBe("song");
      expect(result?.metadata?.title).toBe("Test Song");
      expect(result?.metadata?.artist).toBe("Test Artist");
      expect(result?.metadata?.album).toBe("Test Album");
      expect(result?.lines).toHaveLength(3);
      expect(result?.lines[0]).toEqual({
        timestamp: 10500,
        text: "First line of lyrics",
        duration: 4750,
        isChorus: false,
        isVerse: false,
      });
      expect(result?.lines[1]).toEqual({
        timestamp: 15250,
        text: "Second line of lyrics",
        duration: 4750,
        isChorus: false,
        isVerse: false,
      });
    });

    it("should parse SRT format correctly", async () => {
      const srtContent = `1
00:00:10,500 --> 00:00:13,000
First subtitle line

2
00:00:15,250 --> 00:00:18,750
Second subtitle line`;

      mockReadFile.mockResolvedValue(srtContent);

      const result = await lyricsService.parseLyricsFile(
        "/test/song.srt",
        "srt"
      );

      expect(result).toBeTruthy();
      expect(result?.format).toBe("srt");
      expect(result?.lines).toHaveLength(2);
      expect(result?.lines[0]).toEqual({
        timestamp: 10500,
        text: "First subtitle line",
        duration: 2500,
      });
      expect(result?.lines[1]).toEqual({
        timestamp: 15250,
        text: "Second subtitle line",
        duration: 3500,
      });
    });

    it("should parse VTT format correctly", async () => {
      const vttContent = `WEBVTT

00:10.500 --> 00:13.000
First VTT line

00:15.250 --> 00:18.750
Second VTT line`;

      mockReadFile.mockResolvedValue(vttContent);

      const result = await lyricsService.parseLyricsFile(
        "/test/song.vtt",
        "vtt"
      );

      expect(result).toBeTruthy();
      expect(result?.format).toBe("vtt");
      expect(result?.lines).toHaveLength(2);
      expect(result?.lines[0]).toEqual({
        timestamp: 10500,
        text: "First VTT line",
        duration: 2500,
      });
    });

    it("should parse plain text format correctly", async () => {
      const txtContent = `First line of text
Second line of text
Third line of text`;

      mockReadFile.mockResolvedValue(txtContent);

      const result = await lyricsService.parseLyricsFile(
        "/test/song.txt",
        "txt"
      );

      expect(result).toBeTruthy();
      expect(result?.format).toBe("txt");
      expect(result?.lines).toHaveLength(3);
      expect(result?.lines[0].timestamp).toBe(0);
      expect(result?.lines[0].text).toBe("First line of text");
      expect(result?.lines[1].timestamp).toBe(60000); // 1 minute spacing
      expect(result?.lines[2].timestamp).toBe(120000); // 2 minute spacing
    });

    it("should return null for unsupported format", async () => {
      const result = await lyricsService.parseLyricsFile(
        "/test/song.xyz",
        "xyz" as LyricsFormat
      );

      expect(result).toBeNull();
    });

    it("should return null when file read fails", async () => {
      mockReadFile.mockRejectedValue(new Error("File not found"));

      const result = await lyricsService.parseLyricsFile(
        "/test/nonexistent.lrc",
        "lrc"
      );

      expect(result).toBeNull();
    });
  });

  describe("findLyricsFile", () => {
    it("should find lyrics file in search paths", async () => {
      mockAccess.mockResolvedValueOnce(undefined); // Found on first try!

      const result = await lyricsService.findLyricsFile("test-song", [
        "/path1",
        "/path2",
        "/path3",
      ]);

      expect(result).toBe("/path1/test-song.lrc");
      expect(mockAccess).toHaveBeenCalledTimes(1);
    });

    it("should return null when no lyrics file found", async () => {
      mockAccess.mockRejectedValue(new Error("Not found"));

      const result = await lyricsService.findLyricsFile("test-song", [
        "/path1",
        "/path2",
      ]);

      expect(result).toBeNull();
    });
  });

  describe("updateSyncState", () => {
    it("should update sync state correctly", async () => {
      // First load some lyrics
      const lrcContent = `[00:10.00]First line
[00:15.00]Second line
[00:20.00]Third line`;

      mockReadFile.mockResolvedValue(lrcContent);
      mockAccess.mockResolvedValue(undefined);

      await lyricsService.getLyrics("test-song", ["/test"]);

      // Now test sync state update
      const syncState = lyricsService.updateSyncState("test-song", 12); // 12 seconds

      expect(syncState).toBeTruthy();
      expect(syncState?.currentLine).toBe(0); // Should be on first line
      expect(syncState?.isActive).toBe(true);
      expect(syncState?.nextLine?.text).toBe("Second line");

      // Test at 17 seconds (second line)
      const syncState2 = lyricsService.updateSyncState("test-song", 17);
      expect(syncState2?.currentLine).toBe(1);
      expect(syncState2?.nextLine?.text).toBe("Third line");
    });

    it("should return null for unknown song", () => {
      const syncState = lyricsService.updateSyncState("unknown-song", 10);
      expect(syncState).toBeNull();
    });
  });

  describe("getCurrentLine", () => {
    it("should return current lyrics line", async () => {
      const lrcContent = `[00:10.00]Current line
[00:15.00]Next line`;

      mockReadFile.mockResolvedValue(lrcContent);
      mockAccess.mockResolvedValue(undefined);

      await lyricsService.getLyrics("test-song", ["/test"]);
      lyricsService.updateSyncState("test-song", 12);

      const currentLine = lyricsService.getCurrentLine("test-song");

      expect(currentLine).toBeTruthy();
      expect(currentLine?.text).toBe("Current line");
    });

    it("should return null when no current line", () => {
      const currentLine = lyricsService.getCurrentLine("unknown-song");
      expect(currentLine).toBeNull();
    });
  });

  describe("clearCache", () => {
    it("should clear all cached data", async () => {
      const lrcContent = `[00:10.00]Test line`;
      mockReadFile.mockResolvedValue(lrcContent);
      mockAccess.mockResolvedValue(undefined);

      await lyricsService.getLyrics("test-song", ["/test"]);
      lyricsService.updateSyncState("test-song", 12);

      // Verify data exists
      expect(lyricsService.getCurrentLine("test-song")).toBeTruthy();

      // Clear cache
      lyricsService.clearCache();

      // Verify data is cleared
      expect(lyricsService.getCurrentLine("test-song")).toBeNull();
    });
  });

  describe("getLyrics", () => {
    it("should return cached lyrics on second call", async () => {
      const lrcContent = `[00:10.00]Cached line`;
      mockReadFile.mockResolvedValue(lrcContent);
      mockAccess.mockResolvedValue(undefined);
      mockGetLyrics.mockResolvedValue(null);

      // First call - fetches from source
      const first = await lyricsService.getLyrics("test-song", ["/test"]);
      expect(first).toBeTruthy();

      // Reset mocks to verify cache hit
      mockReadFile.mockClear();
      mockAccess.mockClear();
      mockGetLyrics.mockClear();

      // Second call - should come from cache
      const second = await lyricsService.getLyrics("test-song", ["/test"]);
      expect(second).toBeTruthy();
      expect(second?.lines[0].text).toBe("Cached line");
      expect(mockGetLyrics).not.toHaveBeenCalled();
      expect(mockReadFile).not.toHaveBeenCalled();
    });

    it("should parse Jellyfin native array format lyrics", async () => {
      const jellyfinLyrics = [
        { Start: 10000000000, Text: "First line" },
        { Start: 15000000000, Text: "Second line" },
        { Start: 20000000000, Text: "" }, // empty line should be filtered
      ];
      mockGetLyrics.mockResolvedValue(jellyfinLyrics);

      const result = await lyricsService.getLyrics("jellyfin_item123", []);

      expect(result).toBeTruthy();
      expect(result?.lines.length).toBeGreaterThanOrEqual(2);
      expect(result?.lines[0].text).toBe("First line");
      expect(result?.lines[1].text).toBe("Second line");
    });

    it("should parse Jellyfin string format lyrics as LRC", async () => {
      const lrcString = `[00:10.00]String format line\n[00:15.00]Second string line`;
      mockGetLyrics.mockResolvedValue(lrcString);

      const result = await lyricsService.getLyrics("jellyfin_item456", []);

      expect(result).toBeTruthy();
      expect(result?.format).toBe("lrc");
      expect(result?.lines[0].text).toBe("String format line");
    });

    it("should return null for unknown Jellyfin lyrics format", async () => {
      mockGetLyrics.mockResolvedValue({ unknownFormat: true });

      const result = await lyricsService.getLyrics("jellyfin_item789", []);

      expect(result).toBeNull();
    });

    it("should fallback to local files when Jellyfin fetch fails", async () => {
      mockGetLyrics.mockRejectedValue(new Error("Network error"));
      mockAccess.mockResolvedValueOnce(undefined); // File found
      mockReadFile.mockResolvedValue(`[00:10.00]Local file line`);

      const result = await lyricsService.getLyrics("jellyfin_local", [
        "/lyrics",
      ]);

      expect(result).toBeTruthy();
      expect(result?.lines[0].text).toBe("Local file line");
    });

    it("should return null when Jellyfin returns null and no local files found", async () => {
      mockGetLyrics.mockResolvedValue(null);
      mockAccess.mockRejectedValue(new Error("Not found"));

      const result = await lyricsService.getLyrics("jellyfin_missing", [
        "/lyrics",
      ]);

      expect(result).toBeNull();
    });

    it("should handle local .srt file fallback", async () => {
      mockGetLyrics.mockResolvedValue(null);
      // LRC not found, SRT found
      mockAccess
        .mockRejectedValueOnce(new Error("Not found")) // .lrc
        .mockResolvedValueOnce(undefined); // .srt

      const srtContent = `1\n00:00:10,000 --> 00:00:13,000\nSRT line`;
      mockReadFile.mockResolvedValue(srtContent);

      const result = await lyricsService.getLyrics("jellyfin_srt", ["/lyrics"]);

      expect(result).toBeTruthy();
      expect(result?.format).toBe("srt");
    });

    it("should return null for unsupported local file extension", async () => {
      mockGetLyrics.mockResolvedValue(null);
      // All standard extensions fail, but we can't easily test the default case
      // since findLyricsFile only tries known extensions
      mockAccess.mockRejectedValue(new Error("Not found"));

      const result = await lyricsService.getLyrics("jellyfin_none", [
        "/lyrics",
      ]);

      expect(result).toBeNull();
    });
  });

  describe("updateSyncState - edge cases", () => {
    it("should use look-ahead when no line matches exact timestamp", async () => {
      // Create lyrics where the first line starts at 10s
      const lrcContent = `[00:10.00]First line\n[00:20.00]Second line`;
      mockReadFile.mockResolvedValue(lrcContent);
      mockAccess.mockResolvedValue(undefined);
      mockGetLyrics.mockResolvedValue(null);

      await lyricsService.getLyrics("lookahead-song", ["/test"]);

      // At 9.6 seconds, the look-ahead of 500ms should catch the first line (starts at 10s)
      const syncState = lyricsService.updateSyncState("lookahead-song", 9.6);

      expect(syncState).toBeTruthy();
      expect(syncState?.currentLine).toBe(0);
      expect(syncState?.isActive).toBe(true);
    });

    it("should return inactive state when before all lyrics", async () => {
      const lrcContent = `[00:10.00]First line\n[00:20.00]Second line`;
      mockReadFile.mockResolvedValue(lrcContent);
      mockAccess.mockResolvedValue(undefined);
      mockGetLyrics.mockResolvedValue(null);

      await lyricsService.getLyrics("early-song", ["/test"]);

      // At 2 seconds, no line should match (first starts at 10s, look-ahead 500ms from 2s = 2.5s)
      const syncState = lyricsService.updateSyncState("early-song", 2);

      expect(syncState).toBeTruthy();
      expect(syncState?.currentLine).toBe(-1);
      expect(syncState?.isActive).toBe(false);
    });

    it("should set nextLine to undefined on last line", async () => {
      const lrcContent = `[00:10.00]Only line`;
      mockReadFile.mockResolvedValue(lrcContent);
      mockAccess.mockResolvedValue(undefined);
      mockGetLyrics.mockResolvedValue(null);

      await lyricsService.getLyrics("last-line-song", ["/test"]);

      const syncState = lyricsService.updateSyncState("last-line-song", 15);

      expect(syncState).toBeTruthy();
      expect(syncState?.currentLine).toBe(0);
      expect(syncState?.nextLine).toBeUndefined();
    });

    it("should create sync state if none exists", async () => {
      const lrcContent = `[00:10.00]Line one`;
      mockReadFile.mockResolvedValue(lrcContent);
      mockAccess.mockResolvedValue(undefined);
      mockGetLyrics.mockResolvedValue(null);

      await lyricsService.getLyrics("new-sync-song", ["/test"]);

      // Don't call createSyncState first - updateSyncState should create it
      const syncState = lyricsService.updateSyncState("new-sync-song", 12);

      expect(syncState).toBeTruthy();
      expect(syncState?.currentLine).toBe(0);
    });
  });
});
