import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  syncPlayPause,
  syncPlaybackState,
  PlaybackSyncOptions,
} from "@/hooks/audioPlayerSync";
import { PlaybackState } from "@/types";

const notAllowedError = () =>
  new DOMException(
    "The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission.",
    "NotAllowedError"
  );

function fakeAudio(overrides: Record<string, unknown> = {}): HTMLAudioElement {
  return {
    paused: true,
    readyState: 4,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    volume: 1,
    muted: false,
    currentTime: 0,
    playbackRate: 1,
    ...overrides,
  } as unknown as HTMLAudioElement;
}

const playingState: PlaybackState = {
  isPlaying: true,
  currentTime: 0,
  volume: 80,
  isMuted: false,
  playbackRate: 1.0,
  lyricsOffset: 0,
};

function syncOptions(
  overrides: Partial<PlaybackSyncOptions> = {}
): PlaybackSyncOptions {
  return {
    isLoading: false,
    autoplayBlocked: false,
    lastSeekTimeRef: { current: 0 },
    playFailure: { setError: vi.fn(), onAutoplayBlocked: vi.fn() },
    ...overrides,
  };
}

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe("audioPlayerSync", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("syncPlayPause", () => {
    it("starts playback when the host says playing and the element is ready", () => {
      const audio = fakeAudio();

      syncPlayPause(audio, playingState, syncOptions());

      expect(audio.play).toHaveBeenCalledTimes(1);
    });

    it("does not retry play() while autoplay is blocked", () => {
      const audio = fakeAudio();

      syncPlayPause(
        audio,
        playingState,
        syncOptions({ autoplayBlocked: true })
      );

      expect(audio.play).not.toHaveBeenCalled();
    });

    it("waits for the element to have data before playing", () => {
      const audio = fakeAudio({ readyState: 1 });

      syncPlayPause(audio, playingState, syncOptions());

      expect(audio.play).not.toHaveBeenCalled();
    });

    it("does not play while a new source is still loading", () => {
      const audio = fakeAudio();

      syncPlayPause(audio, playingState, syncOptions({ isLoading: true }));

      expect(audio.play).not.toHaveBeenCalled();
    });

    it("pauses when the host says paused", () => {
      const audio = fakeAudio({ paused: false });

      syncPlayPause(
        audio,
        { ...playingState, isPlaying: false },
        syncOptions()
      );

      expect(audio.pause).toHaveBeenCalledTimes(1);
      expect(audio.play).not.toHaveBeenCalled();
    });

    it("flags autoplay as blocked when play() is rejected by the autoplay policy", async () => {
      const audio = fakeAudio({
        play: vi.fn().mockRejectedValue(notAllowedError()),
      });
      const options = syncOptions();

      syncPlayPause(audio, playingState, options);
      await flushPromises();

      expect(options.playFailure.onAutoplayBlocked).toHaveBeenCalledTimes(1);
      expect(options.playFailure.setError).not.toHaveBeenCalled();
    });

    it("surfaces other play() rejections as errors", async () => {
      const audio = fakeAudio({
        play: vi.fn().mockRejectedValue(new Error("boom")),
      });
      const options = syncOptions();

      syncPlayPause(audio, playingState, options);
      await flushPromises();

      expect(options.playFailure.setError).toHaveBeenCalledWith(
        "Play failed: boom"
      );
      expect(options.playFailure.onAutoplayBlocked).not.toHaveBeenCalled();
    });
  });

  describe("syncPlaybackState", () => {
    it("applies play, volume, seek and rate in one pass", () => {
      const audio = fakeAudio({ currentTime: 0 });
      const options = syncOptions();

      syncPlaybackState(
        audio,
        { ...playingState, volume: 50, currentTime: 42, playbackRate: 1.5 },
        options
      );

      expect(audio.play).toHaveBeenCalledTimes(1);
      expect(audio.volume).toBe(0.5);
      expect(audio.currentTime).toBe(42);
      expect(options.lastSeekTimeRef.current).toBe(42);
      expect(audio.playbackRate).toBe(1.5);
    });
  });
});
