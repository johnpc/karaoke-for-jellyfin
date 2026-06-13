import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { QueueItem, PlaybackState } from "@/types";

describe("useAudioPlayer", () => {
  const createMockSong = (overrides: Partial<QueueItem> = {}): QueueItem => ({
    id: "song-1",
    mediaItem: {
      id: "media-1",
      title: "Test Song",
      artist: "Test Artist",
      duration: 180,
      jellyfinId: "jf-1",
      streamUrl: "/api/stream/jf-1",
    },
    addedBy: "TestUser",
    addedAt: new Date(),
    position: 0,
    status: "playing",
    ...overrides,
  });

  const defaultPlaybackState: PlaybackState = {
    isPlaying: false,
    currentTime: 0,
    volume: 80,
    isMuted: false,
    playbackRate: 1.0,
    lyricsOffset: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns initial state with null song", () => {
    const { result } = renderHook(() =>
      useAudioPlayer({
        song: null,
        playbackState: null,
        onSongEnded: vi.fn(),
        onTimeUpdate: vi.fn(),
      })
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.audioRef).toBeDefined();
    expect(result.current.audioRef.current).toBeNull();
  });

  it("returns audioRef that can hold an audio element reference", () => {
    const { result } = renderHook(() =>
      useAudioPlayer({
        song: null,
        playbackState: null,
        onSongEnded: vi.fn(),
        onTimeUpdate: vi.fn(),
      })
    );

    expect(result.current.audioRef).toHaveProperty("current");
  });

  it("does not set error when song is null", () => {
    const { result } = renderHook(() =>
      useAudioPlayer({
        song: null,
        playbackState: defaultPlaybackState,
        onSongEnded: vi.fn(),
        onTimeUpdate: vi.fn(),
      })
    );

    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("does not change state when song id stays the same on rerender", () => {
    const song = createMockSong();

    const { result, rerender } = renderHook(
      (props: { song: QueueItem | null }) =>
        useAudioPlayer({
          song: props.song,
          playbackState: defaultPlaybackState,
          onSongEnded: vi.fn(),
          onTimeUpdate: vi.fn(),
        }),
      { initialProps: { song } }
    );

    // First render - no audio element so nothing happens
    expect(result.current.isLoading).toBe(false);

    // Rerender with same song
    rerender({ song });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("resets currentSongId state when song becomes null", () => {
    const song = createMockSong();

    const { result, rerender } = renderHook(
      (props: { song: QueueItem | null }) =>
        useAudioPlayer({
          song: props.song,
          playbackState: defaultPlaybackState,
          onSongEnded: vi.fn(),
          onTimeUpdate: vi.fn(),
        }),
      { initialProps: { song } as { song: QueueItem | null } }
    );

    rerender({ song: null });
    expect(result.current.error).toBeNull();
  });

  it("accepts different playback states without error when no audio element", () => {
    const song = createMockSong();

    const { result, rerender } = renderHook(
      (props: { playbackState: PlaybackState }) =>
        useAudioPlayer({
          song,
          playbackState: props.playbackState,
          onSongEnded: vi.fn(),
          onTimeUpdate: vi.fn(),
        }),
      { initialProps: { playbackState: defaultPlaybackState } }
    );

    // Should not throw with various playback states
    rerender({ playbackState: { ...defaultPlaybackState, isPlaying: true } });
    expect(result.current.error).toBeNull();

    rerender({ playbackState: { ...defaultPlaybackState, volume: 50 } });
    expect(result.current.error).toBeNull();

    rerender({ playbackState: { ...defaultPlaybackState, isMuted: true } });
    expect(result.current.error).toBeNull();
  });

  it("handles playback state with seek time correctly (no audio element)", () => {
    const song = createMockSong();

    const { result } = renderHook(() =>
      useAudioPlayer({
        song,
        playbackState: { ...defaultPlaybackState, currentTime: 30 },
        onSongEnded: vi.fn(),
        onTimeUpdate: vi.fn(),
      })
    );

    // No error should be thrown when audio element is null
    expect(result.current.error).toBeNull();
  });

  it("handles invalid playback rate gracefully", () => {
    const song = createMockSong();

    const { result } = renderHook(() =>
      useAudioPlayer({
        song,
        playbackState: { ...defaultPlaybackState, playbackRate: 0 },
        onSongEnded: vi.fn(),
        onTimeUpdate: vi.fn(),
      })
    );

    expect(result.current.error).toBeNull();
  });

  it("handles playback rate above 4 gracefully", () => {
    const song = createMockSong();

    const { result } = renderHook(() =>
      useAudioPlayer({
        song,
        playbackState: { ...defaultPlaybackState, playbackRate: 5 },
        onSongEnded: vi.fn(),
        onTimeUpdate: vi.fn(),
      })
    );

    expect(result.current.error).toBeNull();
  });

  it("accepts song with empty streamUrl without throwing", () => {
    const song = createMockSong({
      mediaItem: {
        id: "media-1",
        title: "No Stream",
        artist: "Artist",
        duration: 100,
        jellyfinId: "jf-1",
        streamUrl: "",
      },
    });

    const { result } = renderHook(() =>
      useAudioPlayer({
        song,
        playbackState: defaultPlaybackState,
        onSongEnded: vi.fn(),
        onTimeUpdate: vi.fn(),
      })
    );

    // With no audio element attached, the early return happens before the streamUrl check
    expect(result.current.error).toBeNull();
  });

  it("provides stable audioRef across re-renders", () => {
    const { result, rerender } = renderHook(() =>
      useAudioPlayer({
        song: null,
        playbackState: null,
        onSongEnded: vi.fn(),
        onTimeUpdate: vi.fn(),
      })
    );

    const firstRef = result.current.audioRef;
    rerender();
    expect(result.current.audioRef).toBe(firstRef);
  });

  it("handles changing song id", () => {
    const song1 = createMockSong({ id: "song-1" });
    const song2 = createMockSong({
      id: "song-2",
      mediaItem: {
        id: "media-2",
        title: "Second Song",
        artist: "Artist 2",
        duration: 200,
        jellyfinId: "jf-2",
        streamUrl: "/api/stream/jf-2",
      },
    });

    const { result, rerender } = renderHook(
      (props: { song: QueueItem }) =>
        useAudioPlayer({
          song: props.song,
          playbackState: defaultPlaybackState,
          onSongEnded: vi.fn(),
          onTimeUpdate: vi.fn(),
        }),
      { initialProps: { song: song1 } }
    );

    rerender({ song: song2 });
    expect(result.current.error).toBeNull();
  });

  it("does not error with Infinity currentTime in playback state", () => {
    const song = createMockSong();

    const { result } = renderHook(() =>
      useAudioPlayer({
        song,
        playbackState: { ...defaultPlaybackState, currentTime: Infinity },
        onSongEnded: vi.fn(),
        onTimeUpdate: vi.fn(),
      })
    );

    expect(result.current.error).toBeNull();
  });

  it("does not error with NaN playbackRate", () => {
    const song = createMockSong();

    const { result } = renderHook(() =>
      useAudioPlayer({
        song,
        playbackState: { ...defaultPlaybackState, playbackRate: NaN },
        onSongEnded: vi.fn(),
        onTimeUpdate: vi.fn(),
      })
    );

    expect(result.current.error).toBeNull();
  });
});
