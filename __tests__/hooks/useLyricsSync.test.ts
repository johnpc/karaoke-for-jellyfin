import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLyricsSync } from "@/hooks/useLyricsSync";
import { PlaybackState } from "@/types";

// Mock the useLyrics hook
const mockUseLyrics = vi.fn();
vi.mock("@/hooks/useLyrics", () => ({
  useLyrics: (options: unknown) => mockUseLyrics(options),
}));

describe("useLyricsSync", () => {
  const defaultLyricsReturn = {
    lyricsFile: null,
    syncState: null,
    currentLine: "♪ Instrumental ♪",
    nextLine: "",
    isLoading: false,
    error: null,
    clearLyrics: vi.fn(),
    loadLyrics: vi.fn(),
    syncLyrics: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLyrics.mockReturnValue(defaultLyricsReturn);
  });

  it("returns default values when no playback state", () => {
    const { result } = renderHook(() =>
      useLyricsSync({
        lyricsPath: undefined,
        playbackState: null,
        duration: 0,
      })
    );

    expect(result.current.currentLine).toBe("♪ Instrumental ♪");
    expect(result.current.nextLine).toBe("");
    expect(result.current.lyricsLoading).toBe(false);
    expect(result.current.lyricsError).toBeNull();
    expect(result.current.currentTime).toBe(0);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.progress).toBe(0);
  });

  it("passes lyricsPath as songId to useLyrics", () => {
    renderHook(() =>
      useLyricsSync({
        lyricsPath: "path/to/lyrics.lrc",
        playbackState: null,
        duration: 180,
      })
    );

    expect(mockUseLyrics).toHaveBeenCalledWith(
      expect.objectContaining({
        songId: "path/to/lyrics.lrc",
        autoSync: true,
      })
    );
  });

  it("passes undefined songId when lyricsPath is undefined", () => {
    renderHook(() =>
      useLyricsSync({
        lyricsPath: undefined,
        playbackState: null,
        duration: 180,
      })
    );

    expect(mockUseLyrics).toHaveBeenCalledWith(
      expect.objectContaining({
        songId: undefined,
        autoSync: true,
      })
    );
  });

  it("updates currentTime from playback state with lyrics offset", () => {
    const playbackState: PlaybackState = {
      isPlaying: true,
      currentTime: 30,
      volume: 80,
      isMuted: false,
      playbackRate: 1.0,
      lyricsOffset: 2,
    };

    const { result } = renderHook(() =>
      useLyricsSync({
        lyricsPath: "test.lrc",
        playbackState,
        duration: 180,
      })
    );

    // currentTime should be playbackState.currentTime + lyricsOffset
    expect(result.current.currentTime).toBe(32);
  });

  it("updates isPlaying from playback state", () => {
    const playbackState: PlaybackState = {
      isPlaying: true,
      currentTime: 10,
      volume: 80,
      isMuted: false,
      playbackRate: 1.0,
      lyricsOffset: 0,
    };

    const { result } = renderHook(() =>
      useLyricsSync({
        lyricsPath: "test.lrc",
        playbackState,
        duration: 180,
      })
    );

    expect(result.current.isPlaying).toBe(true);
  });

  it("calculates progress correctly", () => {
    const playbackState: PlaybackState = {
      isPlaying: true,
      currentTime: 90,
      volume: 80,
      isMuted: false,
      playbackRate: 1.0,
      lyricsOffset: 0,
    };

    const { result } = renderHook(() =>
      useLyricsSync({
        lyricsPath: "test.lrc",
        playbackState,
        duration: 180,
      })
    );

    expect(result.current.progress).toBe(50);
  });

  it("returns 0 progress when duration is 0", () => {
    const playbackState: PlaybackState = {
      isPlaying: true,
      currentTime: 30,
      volume: 80,
      isMuted: false,
      playbackRate: 1.0,
      lyricsOffset: 0,
    };

    const { result } = renderHook(() =>
      useLyricsSync({
        lyricsPath: "test.lrc",
        playbackState,
        duration: 0,
      })
    );

    expect(result.current.progress).toBe(0);
  });

  it("returns 0 progress when playbackState is null", () => {
    const { result } = renderHook(() =>
      useLyricsSync({
        lyricsPath: "test.lrc",
        playbackState: null,
        duration: 180,
      })
    );

    expect(result.current.progress).toBe(0);
  });

  it("handles lyricsOffset of 0", () => {
    const playbackState: PlaybackState = {
      isPlaying: false,
      currentTime: 45,
      volume: 80,
      isMuted: false,
      playbackRate: 1.0,
      lyricsOffset: 0,
    };

    const { result } = renderHook(() =>
      useLyricsSync({
        lyricsPath: "test.lrc",
        playbackState,
        duration: 200,
      })
    );

    expect(result.current.currentTime).toBe(45);
  });

  it("returns lyrics data from useLyrics", () => {
    const lyricsData = {
      ...defaultLyricsReturn,
      lyricsFile: { songId: "test", lines: [], format: "lrc" as const },
      syncState: { currentLine: 0, currentTimestamp: 0, isActive: true },
      currentLine: "Hello world",
      nextLine: "Next verse",
      isLoading: false,
      error: null,
    };
    mockUseLyrics.mockReturnValue(lyricsData);

    const { result } = renderHook(() =>
      useLyricsSync({
        lyricsPath: "test.lrc",
        playbackState: null,
        duration: 180,
      })
    );

    expect(result.current.currentLine).toBe("Hello world");
    expect(result.current.nextLine).toBe("Next verse");
    expect(result.current.lyricsFile).toEqual(lyricsData.lyricsFile);
    expect(result.current.syncState).toEqual(lyricsData.syncState);
  });

  it("passes loading state from useLyrics", () => {
    mockUseLyrics.mockReturnValue({
      ...defaultLyricsReturn,
      isLoading: true,
    });

    const { result } = renderHook(() =>
      useLyricsSync({
        lyricsPath: "test.lrc",
        playbackState: null,
        duration: 180,
      })
    );

    expect(result.current.lyricsLoading).toBe(true);
  });

  it("passes error from useLyrics", () => {
    mockUseLyrics.mockReturnValue({
      ...defaultLyricsReturn,
      error: "Lyrics not found",
    });

    const { result } = renderHook(() =>
      useLyricsSync({
        lyricsPath: "test.lrc",
        playbackState: null,
        duration: 180,
      })
    );

    expect(result.current.lyricsError).toBe("Lyrics not found");
  });

  it("handles negative lyrics offset", () => {
    const playbackState: PlaybackState = {
      isPlaying: true,
      currentTime: 10,
      volume: 80,
      isMuted: false,
      playbackRate: 1.0,
      lyricsOffset: -3,
    };

    const { result } = renderHook(() =>
      useLyricsSync({
        lyricsPath: "test.lrc",
        playbackState,
        duration: 180,
      })
    );

    expect(result.current.currentTime).toBe(7);
  });
});
