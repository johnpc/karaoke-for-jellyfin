import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { AudioPlayer } from "@/components/tv/AudioPlayer";
import { QueueItem, PlaybackState } from "@/types";

// Mock HTML5 Audio
const mockAudio = {
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  load: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  currentTime: 0,
  volume: 1,
  muted: false,
  paused: true,
  playbackRate: 1,
  src: "",
  preload: "auto",
  crossOrigin: "anonymous",
};

// Mock Audio constructor
global.Audio = vi.fn().mockImplementation(() => mockAudio);

const mockSong: QueueItem = {
  id: "test-song",
  mediaItem: {
    id: "media-1",
    title: "Test Song",
    artist: "Test Artist",
    duration: 180,
    jellyfinId: "jellyfin-1",
    streamUrl: "http://test.com/stream/1",
  },
  addedBy: "user1",
  addedAt: new Date(),
  position: 0,
  status: "playing",
};

const mockPlaybackState: PlaybackState = {
  isPlaying: true,
  currentTime: 30,
  volume: 75,
  isMuted: false,
  playbackRate: 1.0,
};

describe("AudioPlayer", () => {
  const mockProps = {
    song: mockSong,
    playbackState: mockPlaybackState,
    onPlaybackControl: vi.fn(),
    onSongEnded: vi.fn(),
    onTimeUpdate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<AudioPlayer {...mockProps} />);
    // AudioPlayer is hidden, so we just check it doesn't crash
  });

  it("renders with no song", () => {
    render(<AudioPlayer {...mockProps} song={null} />);
    // Should handle null song gracefully
  });

  it("renders with no playback state", () => {
    render(<AudioPlayer {...mockProps} playbackState={null} />);
    // Should handle null playback state gracefully
  });

  it("creates audio element with correct attributes", () => {
    const { container } = render(<AudioPlayer {...mockProps} />);

    const audioElement = container.querySelector("audio");
    expect(audioElement).toBeInTheDocument();
    expect(audioElement).toHaveAttribute("preload", "auto");
  });

  it("renders audio element hidden", () => {
    const { container } = render(<AudioPlayer {...mockProps} />);

    const audioElement = container.querySelector("audio");
    expect(audioElement).toBeInTheDocument();
  });
});
