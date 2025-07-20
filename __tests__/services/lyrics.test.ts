import { LyricsService } from "@/services/lyrics";
import { LyricsFormat } from "@/types";
import { promises as fs } from "fs";
import path from "path";

// Mock fs module
jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
    access: jest.fn(),
  },
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe("LyricsService", () => {
  let lyricsService: LyricsService;

  beforeEach(() => {
    lyricsService = new LyricsService();
    jest.clearAllMocks();
  });

  describe("parseLyricsFile", () => {
    it("should parse LRC format correctly", async () => {
      const lrcContent = `[ti:Test Song]
[ar:Test Artist]
[al:Test Album]
[00:10.50]First line of lyrics
[00:15.25]Second line of lyrics
[00:20.00]Third line of lyrics`;

      mockFs.readFile.mockResolvedValue(lrcContent);

      const result = await lyricsService.parseLyricsFile(
        "/test/song.lrc",
        "lrc",
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

      mockFs.readFile.mockResolvedValue(srtContent);

      const result = await lyricsService.parseLyricsFile(
        "/test/song.srt",
        "srt",
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

      mockFs.readFile.mockResolvedValue(vttContent);

      const result = await lyricsService.parseLyricsFile(
        "/test/song.vtt",
        "vtt",
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

      mockFs.readFile.mockResolvedValue(txtContent);

      const result = await lyricsService.parseLyricsFile(
        "/test/song.txt",
        "txt",
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
        "xyz" as LyricsFormat,
      );

      expect(result).toBeNull();
    });

    it("should return null when file read fails", async () => {
      mockFs.readFile.mockRejectedValue(new Error("File not found"));

      const result = await lyricsService.parseLyricsFile(
        "/test/nonexistent.lrc",
        "lrc",
      );

      expect(result).toBeNull();
    });
  });

  describe("findLyricsFile", () => {
    it("should find lyrics file in search paths", async () => {
      mockFs.access.mockResolvedValueOnce(undefined); // Found on first try!

      const result = await lyricsService.findLyricsFile("test-song", [
        "/path1",
        "/path2",
        "/path3",
      ]);

      expect(result).toBe("/path1/test-song.lrc");
      expect(mockFs.access).toHaveBeenCalledTimes(1);
    });

    it("should return null when no lyrics file found", async () => {
      mockFs.access.mockRejectedValue(new Error("Not found"));

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

      mockFs.readFile.mockResolvedValue(lrcContent);
      mockFs.access.mockResolvedValue(undefined);

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

      mockFs.readFile.mockResolvedValue(lrcContent);
      mockFs.access.mockResolvedValue(undefined);

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
      mockFs.readFile.mockResolvedValue(lrcContent);
      mockFs.access.mockResolvedValue(undefined);

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
});
