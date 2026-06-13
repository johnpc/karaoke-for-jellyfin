import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminPlaybackControls } from "@/components/mobile/admin/AdminPlaybackControls";
import { QueueItem, PlaybackState, PlaybackCommand } from "@/types";

const createQueueItem = (overrides: Partial<QueueItem> = {}): QueueItem => ({
  id: "queue-1",
  mediaItem: {
    id: "song-1",
    title: "Test Song",
    artist: "Test Artist",
    duration: 240,
    jellyfinId: "jellyfin-1",
    streamUrl: "http://test.com/stream/1",
  },
  addedBy: "John",
  addedAt: new Date(),
  position: 0,
  status: "playing",
  ...overrides,
});

const createPlaybackState = (
  overrides: Partial<PlaybackState> = {}
): PlaybackState => ({
  isPlaying: true,
  currentTime: 30,
  volume: 80,
  isMuted: false,
  playbackRate: 1.0,
  lyricsOffset: 0,
  ...overrides,
});

describe("AdminPlaybackControls", () => {
  const mockOnSkip = vi.fn();
  const mockOnPlaybackControl = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderControls = (
    overrides: {
      currentSong?: QueueItem | null;
      playbackState?: PlaybackState | null;
      pendingQueueLength?: number;
    } = {}
  ) => {
    return render(
      <AdminPlaybackControls
        currentSong={overrides.currentSong ?? null}
        playbackState={overrides.playbackState ?? null}
        pendingQueueLength={overrides.pendingQueueLength ?? 0}
        onSkip={mockOnSkip}
        onPlaybackControl={mockOnPlaybackControl}
      />
    );
  };

  describe("rendering", () => {
    it("renders the controls container", () => {
      renderControls();

      expect(screen.getByTestId("playback-controls")).toBeInTheDocument();
    });

    it("shows 'Controls' heading", () => {
      renderControls();

      expect(screen.getByText("Controls")).toBeInTheDocument();
    });
  });

  describe("play/pause button", () => {
    it("is disabled when no current song and empty queue", () => {
      renderControls({ currentSong: null, pendingQueueLength: 0 });

      expect(screen.getByTestId("play-pause-button")).toBeDisabled();
    });

    it("is enabled when current song exists", () => {
      renderControls({
        currentSong: createQueueItem(),
        playbackState: createPlaybackState(),
      });

      expect(screen.getByTestId("play-pause-button")).not.toBeDisabled();
    });

    it("is enabled when pending queue has items", () => {
      renderControls({
        currentSong: null,
        pendingQueueLength: 3,
        playbackState: createPlaybackState(),
      });

      expect(screen.getByTestId("play-pause-button")).not.toBeDisabled();
    });

    it("sends pause command when currently playing", () => {
      renderControls({
        currentSong: createQueueItem(),
        playbackState: createPlaybackState({ isPlaying: true }),
      });

      fireEvent.click(screen.getByTestId("play-pause-button"));

      expect(mockOnPlaybackControl).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "pause",
          userId: "mobile-admin",
        })
      );
    });

    it("sends play command when currently paused", () => {
      renderControls({
        currentSong: createQueueItem(),
        playbackState: createPlaybackState({ isPlaying: false }),
      });

      fireEvent.click(screen.getByTestId("play-pause-button"));

      expect(mockOnPlaybackControl).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "play",
          userId: "mobile-admin",
        })
      );
    });

    it("does not send command when playbackState is null", () => {
      renderControls({
        currentSong: createQueueItem(),
        playbackState: null,
        pendingQueueLength: 1,
      });

      fireEvent.click(screen.getByTestId("play-pause-button"));

      expect(mockOnPlaybackControl).not.toHaveBeenCalled();
    });
  });

  describe("skip button", () => {
    it("is disabled when no current song", () => {
      renderControls({ currentSong: null });

      expect(screen.getByTestId("skip-button")).toBeDisabled();
    });

    it("is enabled when current song exists", () => {
      renderControls({ currentSong: createQueueItem() });

      expect(screen.getByTestId("skip-button")).not.toBeDisabled();
    });

    it("calls onSkip when clicked", () => {
      renderControls({ currentSong: createQueueItem() });

      fireEvent.click(screen.getByTestId("skip-button"));

      expect(mockOnSkip).toHaveBeenCalledTimes(1);
    });
  });

  describe("seek control", () => {
    it("is not shown when no current song", () => {
      renderControls({ currentSong: null });

      expect(screen.queryByTestId("seek-control")).not.toBeInTheDocument();
    });

    it("is shown when current song exists", () => {
      renderControls({
        currentSong: createQueueItem(),
        playbackState: createPlaybackState(),
      });

      expect(screen.getByTestId("seek-control")).toBeInTheDocument();
    });

    it("sends seek command when slider changed", () => {
      renderControls({
        currentSong: createQueueItem(),
        playbackState: createPlaybackState({ currentTime: 30 }),
      });

      fireEvent.change(screen.getByTestId("seek-slider"), {
        target: { value: "120" },
      });

      expect(mockOnPlaybackControl).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "seek",
          value: 120,
          userId: "mobile-admin",
        })
      );
    });

    it("clamps seek value to minimum of 0", () => {
      renderControls({
        currentSong: createQueueItem(),
        playbackState: createPlaybackState({ currentTime: 5 }),
      });

      // Rewind button seeks to currentTime - 10 = -5, which should be clamped to 0
      const rewindBtns = screen.getAllByRole("button");
      // The first button is the rewind button
      fireEvent.click(rewindBtns[0]);

      expect(mockOnPlaybackControl).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "seek",
          value: 0,
          userId: "mobile-admin",
        })
      );
    });

    it("shows formatted current time", () => {
      renderControls({
        currentSong: createQueueItem(),
        playbackState: createPlaybackState({ currentTime: 125 }),
      });

      // 125 seconds = 2:05
      expect(screen.getByText("2:05")).toBeInTheDocument();
    });

    it("shows formatted total duration", () => {
      renderControls({
        currentSong: createQueueItem(), // duration: 240 = 4:00
        playbackState: createPlaybackState(),
      });

      expect(screen.getByText("4:00")).toBeInTheDocument();
    });
  });

  describe("volume control", () => {
    it("sends volume command when slider changed", () => {
      renderControls({
        playbackState: createPlaybackState({ volume: 80 }),
      });

      fireEvent.change(screen.getByTestId("volume-slider"), {
        target: { value: "50" },
      });

      expect(mockOnPlaybackControl).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "volume",
          value: 50,
          userId: "mobile-admin",
        })
      );
    });

    it("clamps volume to max 100", () => {
      renderControls({
        playbackState: createPlaybackState(),
      });

      // Directly test clamping by sending value > 100 via the slider
      fireEvent.change(screen.getByTestId("volume-slider"), {
        target: { value: "150" },
      });

      expect(mockOnPlaybackControl).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "volume",
          value: 100,
        })
      );
    });

    it("shows default volume of 80 when playbackState is null", () => {
      renderControls({ playbackState: null });

      expect(screen.getByText("80%")).toBeInTheDocument();
    });

    it("shows actual volume percentage", () => {
      renderControls({
        playbackState: createPlaybackState({ volume: 65 }),
      });

      expect(screen.getByText("65%")).toBeInTheDocument();
    });
  });

  describe("mute button", () => {
    it("sends mute command when clicked", () => {
      renderControls({
        playbackState: createPlaybackState({ isMuted: false }),
      });

      fireEvent.click(screen.getByTestId("mute-button"));

      expect(mockOnPlaybackControl).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "mute",
          userId: "mobile-admin",
        })
      );
    });
  });

  describe("playback status badge", () => {
    it("shows 'Playing' when isPlaying is true", () => {
      renderControls({
        playbackState: createPlaybackState({ isPlaying: true }),
      });

      const status = screen.getByTestId("playback-status");
      expect(status).toHaveTextContent("Playing");
    });

    it("shows 'Paused' when isPlaying is false", () => {
      renderControls({
        playbackState: createPlaybackState({ isPlaying: false }),
      });

      const status = screen.getByTestId("playback-status");
      expect(status).toHaveTextContent("Paused");
    });

    it("shows 'Paused' when playbackState is null", () => {
      renderControls({ playbackState: null });

      const status = screen.getByTestId("playback-status");
      expect(status).toHaveTextContent("Paused");
    });
  });
});
