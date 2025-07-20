import React from "react";
import { render } from "@testing-library/react";
import { AudioPlayer } from "@/components/tv/AudioPlayer";
import { QueueItem, PlaybackState } from "@/types";

// Mock HTML5 Audio
const mockAudio = {
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  load: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
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
global.Audio = jest.fn().mockImplementation(() => mockAudio);

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
    onPlaybackControl: jest.fn(),
    onSongEnded: jest.fn(),
    onTimeUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(audioElement).toHaveAttribute("crossorigin", "anonymous");
    expect(audioElement).toHaveStyle({ display: "none" });
  });

  it("shows debug info in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true
    });

    const { container } = render(<AudioPlayer {...mockProps} />);

    // Should show debug info in development
    expect(container.textContent).toContain("Audio: Loaded");
    expect(container.textContent).toContain("State: Playing");
    expect(container.textContent).toContain("Volume: 75%");

    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      configurable: true
    });
  });

  it("does not show debug info in production mode", () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true
    });

    const { container } = render(<AudioPlayer {...mockProps} />);

    // Should not show debug info in production
    expect(container.textContent).not.toContain("Audio: Loaded");

    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      configurable: true
    });
  });
});
