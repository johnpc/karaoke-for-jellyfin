import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlaybackTab } from "@/components/tv/host-controls/PlaybackTab";
import { QueueItem, PlaybackState, KaraokeSession } from "@/types";

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

const createSession = (): KaraokeSession => ({
  id: "session-1",
  name: "Test Session",
  queue: [],
  currentSong: null,
  playbackState: createPlaybackState(),
  connectedUsers: [],
  hostControls: {
    autoAdvance: true,
    allowUserSkip: true,
    allowUserRemove: true,
    maxSongsPerUser: 5,
    requireApproval: false,
  },
  settings: {
    displayName: "Test",
    isPublic: true,
    maxUsers: 10,
    lyricsEnabled: true,
    crossfadeEnabled: false,
    crossfadeDuration: 3,
  },
  createdAt: new Date(),
  lastActivity: new Date(),
});

describe("PlaybackTab", () => {
  const mockOnPlayPause = vi.fn();
  const mockOnSeek = vi.fn();
  const mockOnVolumeChange = vi.fn();
  const mockOnMute = vi.fn();
  const mockOnSkip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPlaybackTab = (
    overrides: {
      currentSong?: QueueItem | null;
      playbackState?: PlaybackState | null;
      pendingQueue?: QueueItem[];
      session?: KaraokeSession | null;
    } = {}
  ) => {
    return render(
      <PlaybackTab
        currentSong={overrides.currentSong ?? null}
        playbackState={overrides.playbackState ?? null}
        pendingQueue={overrides.pendingQueue ?? []}
        session={overrides.session ?? null}
        onPlayPause={mockOnPlayPause}
        onSeek={mockOnSeek}
        onVolumeChange={mockOnVolumeChange}
        onMute={mockOnMute}
        onSkip={mockOnSkip}
      />
    );
  };

  describe("when no current song and empty queue", () => {
    it("shows 'No Songs in Queue' warning", () => {
      renderPlaybackTab();

      expect(screen.getByText("No Songs in Queue")).toBeInTheDocument();
    });

    it("disables play/pause button", () => {
      renderPlaybackTab();

      const playPauseBtn = screen.getByTestId("tv-play-pause");
      expect(playPauseBtn).toBeDisabled();
    });

    it("disables skip button", () => {
      renderPlaybackTab();

      const skipBtn = screen.getByTestId("tv-skip");
      expect(skipBtn).toBeDisabled();
    });

    it("does not show seek bar", () => {
      renderPlaybackTab();

      expect(screen.queryByTestId("progress-bar")).not.toBeInTheDocument();
    });

    it("shows session debug info", () => {
      renderPlaybackTab({ session: createSession() });

      expect(screen.getByText(/Session=Active/)).toBeInTheDocument();
    });

    it("shows no session debug info when session is null", () => {
      renderPlaybackTab({ session: null });

      expect(screen.getByText(/Session=None/)).toBeInTheDocument();
    });
  });

  describe("when current song is playing", () => {
    it("shows 'Currently Playing' card with song info", () => {
      const song = createQueueItem();
      renderPlaybackTab({
        currentSong: song,
        playbackState: createPlaybackState(),
      });

      expect(screen.getByText("Currently Playing")).toBeInTheDocument();
      expect(screen.getByText("Test Song")).toBeInTheDocument();
      expect(screen.getByText("Test Artist")).toBeInTheDocument();
      expect(screen.getByText(/Added by John/)).toBeInTheDocument();
    });

    it("does not show the no-queue warning", () => {
      renderPlaybackTab({
        currentSong: createQueueItem(),
        playbackState: createPlaybackState(),
      });

      expect(screen.queryByText("No Songs in Queue")).not.toBeInTheDocument();
    });

    it("enables play/pause button", () => {
      renderPlaybackTab({
        currentSong: createQueueItem(),
        playbackState: createPlaybackState(),
      });

      expect(screen.getByTestId("tv-play-pause")).not.toBeDisabled();
    });

    it("enables skip button", () => {
      renderPlaybackTab({
        currentSong: createQueueItem(),
        playbackState: createPlaybackState(),
      });

      expect(screen.getByTestId("tv-skip")).not.toBeDisabled();
    });

    it("shows seek bar with current time and duration", () => {
      renderPlaybackTab({
        currentSong: createQueueItem(),
        playbackState: createPlaybackState({ currentTime: 90 }),
      });

      expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
      expect(screen.getByTestId("current-time")).toHaveTextContent("1:30");
      expect(screen.getByTestId("total-duration")).toHaveTextContent("4:00");
    });
  });

  describe("playback state display", () => {
    it("shows 'Playing' badge when isPlaying is true", () => {
      renderPlaybackTab({
        currentSong: createQueueItem(),
        playbackState: createPlaybackState({ isPlaying: true }),
      });

      expect(screen.getByText("Playing")).toBeInTheDocument();
    });

    it("shows 'Paused' badge when isPlaying is false", () => {
      renderPlaybackTab({
        currentSong: createQueueItem(),
        playbackState: createPlaybackState({ isPlaying: false }),
      });

      expect(screen.getByText("Paused")).toBeInTheDocument();
    });

    it("shows 'Paused' when playbackState is null", () => {
      renderPlaybackTab({ currentSong: createQueueItem() });

      expect(screen.getByText("Paused")).toBeInTheDocument();
    });
  });

  describe("button interactions", () => {
    it("calls onPlayPause when play/pause button clicked", () => {
      renderPlaybackTab({
        currentSong: createQueueItem(),
        playbackState: createPlaybackState(),
      });

      fireEvent.click(screen.getByTestId("tv-play-pause"));

      expect(mockOnPlayPause).toHaveBeenCalledTimes(1);
    });

    it("calls onSkip when skip button clicked", () => {
      renderPlaybackTab({
        currentSong: createQueueItem(),
        playbackState: createPlaybackState(),
      });

      fireEvent.click(screen.getByTestId("tv-skip"));

      expect(mockOnSkip).toHaveBeenCalledTimes(1);
    });

    it("calls onSeek with rewind value when rewind button clicked", () => {
      renderPlaybackTab({
        currentSong: createQueueItem(),
        playbackState: createPlaybackState({ currentTime: 30 }),
      });

      const rewindBtn = screen.getByTitle("Rewind 10s");
      fireEvent.click(rewindBtn);

      expect(mockOnSeek).toHaveBeenCalledWith(20); // 30 - 10
    });

    it("calls onSeek with 0 when seek slider changed", () => {
      renderPlaybackTab({
        currentSong: createQueueItem(),
        playbackState: createPlaybackState({ currentTime: 30 }),
      });

      const seekBar = screen.getByTestId("progress-bar");
      fireEvent.change(seekBar, { target: { value: "60" } });

      expect(mockOnSeek).toHaveBeenCalledWith(60);
    });
  });

  describe("volume controls", () => {
    it("calls onMute when mute button clicked", () => {
      renderPlaybackTab({
        playbackState: createPlaybackState({ isMuted: false }),
      });

      // Find the volume section and its button
      const volumeSection = screen.getByTestId("tv-volume");
      const muteBtn = volumeSection.querySelector("button");
      fireEvent.click(muteBtn!);

      expect(mockOnMute).toHaveBeenCalledTimes(1);
    });

    it("calls onVolumeChange when volume slider changed", () => {
      renderPlaybackTab({
        playbackState: createPlaybackState({ volume: 80 }),
      });

      const volumeSection = screen.getByTestId("tv-volume");
      const slider = volumeSection.querySelector("input[type='range']");
      fireEvent.change(slider!, { target: { value: "60" } });

      expect(mockOnVolumeChange).toHaveBeenCalledWith(60);
    });

    it("shows default volume of 80 when playbackState is null", () => {
      renderPlaybackTab();

      expect(screen.getByText("80%")).toBeInTheDocument();
    });

    it("shows actual volume from playbackState", () => {
      renderPlaybackTab({
        playbackState: createPlaybackState({ volume: 45 }),
      });

      expect(screen.getByText("45%")).toBeInTheDocument();
    });
  });

  describe("pending queue affects button state", () => {
    it("enables play/pause when queue has items but no current song", () => {
      renderPlaybackTab({
        pendingQueue: [createQueueItem({ id: "q1" })],
        playbackState: createPlaybackState(),
      });

      expect(screen.getByTestId("tv-play-pause")).not.toBeDisabled();
    });
  });
});
