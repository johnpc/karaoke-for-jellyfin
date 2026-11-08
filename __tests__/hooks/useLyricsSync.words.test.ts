import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLyricsSync } from "@/hooks/useLyricsSync";
import { LyricsFile, LyricsSyncState } from "@/types";

const mockUseLyrics = vi.fn();
vi.mock("@/hooks/useLyrics", () => ({
  useLyrics: (options: unknown) => mockUseLyrics(options),
}));

const lyricsFile: LyricsFile = {
  songId: "song",
  format: "lrc",
  lines: [
    { timestamp: 1000, text: "Plain" },
    {
      timestamp: 2000,
      text: "Hello world",
      words: [
        { word: "Hello", startMs: 2000 },
        { word: "world", startMs: 2500 },
      ],
    },
    { timestamp: 3000, text: "Last" },
  ],
};

function mockReturn(syncState: LyricsSyncState | null) {
  mockUseLyrics.mockReturnValue({
    lyricsFile,
    syncState,
    currentLine: "x",
    nextLine: "",
    isLoading: false,
    error: null,
    clearLyrics: vi.fn(),
    loadLyrics: vi.fn(),
    syncLyrics: vi.fn(),
  });
}

const render = () =>
  renderHook(() =>
    useLyricsSync({ lyricsPath: "song", playbackState: null, duration: 10 })
  );

describe("useLyricsSync word timing", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exposes words and the next line start for an enhanced line", () => {
    mockReturn({
      currentLine: 1,
      currentTimestamp: 2100,
      isActive: true,
      nextLine: lyricsFile.lines[2],
    });
    const { result } = render();
    expect(result.current.currentLineWords).toEqual(lyricsFile.lines[1].words);
    expect(result.current.currentLineEndMs).toBe(3000);
  });

  it("returns no words for a plain line", () => {
    mockReturn({
      currentLine: 0,
      currentTimestamp: 1100,
      isActive: true,
      nextLine: lyricsFile.lines[1],
    });
    const { result } = render();
    expect(result.current.currentLineWords).toBeUndefined();
    expect(result.current.currentLineEndMs).toBe(2000);
  });

  it("returns undefined before the first line and without sync state", () => {
    mockReturn({ currentLine: -1, currentTimestamp: 0, isActive: false });
    expect(render().result.current.currentLineWords).toBeUndefined();
    expect(render().result.current.currentLineEndMs).toBeUndefined();

    mockReturn(null);
    expect(render().result.current.currentLineWords).toBeUndefined();
  });
});
