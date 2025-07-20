import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { HostControls } from "@/components/tv/HostControls";
import {
  KaraokeSession,
  QueueItem,
  PlaybackState,
  PlaybackCommand,
} from "@/types";

// Mock data
const mockSession: KaraokeSession = {
  id: "test-session",
  name: "Test Session",
  queue: [
    {
      id: "queue-1",
      mediaItem: {
        id: "song-1",
        title: "Test Song 1",
        artist: "Test Artist 1",
        duration: 180,
        jellyfinId: "jellyfin-1",
        streamUrl: "http://test.com/stream/1",
      },
      addedBy: "user1",
      addedAt: new Date(),
      position: 0,
      status: "pending",
    },
    {
      id: "queue-2",
      mediaItem: {
        id: "song-2",
        title: "Test Song 2",
        artist: "Test Artist 2",
        duration: 200,
        jellyfinId: "jellyfin-2",
        streamUrl: "http://test.com/stream/2",
      },
      addedBy: "user2",
      addedAt: new Date(),
      position: 1,
      status: "pending",
    },
  ],
  currentSong: null,
  playbackState: {
    isPlaying: false,
    currentTime: 0,
    volume: 80,
    isMuted: false,
    playbackRate: 1.0,
  },
  connectedUsers: [
    {
      id: "user1",
      name: "User 1",
      isHost: true,
      connectedAt: new Date(),
      lastSeen: new Date(),
    },
    {
      id: "user2",
      name: "User 2",
      isHost: false,
      connectedAt: new Date(),
      lastSeen: new Date(),
    },
  ],
  hostControls: {
    autoAdvance: true,
    allowUserSkip: true,
    allowUserRemove: false,
    maxSongsPerUser: 3,
    requireApproval: false,
  },
  settings: {
    displayName: "Test Session",
    isPublic: false,
    maxUsers: 10,
    lyricsEnabled: true,
    crossfadeEnabled: false,
    crossfadeDuration: 3,
  },
  createdAt: new Date(),
  lastActivity: new Date(),
};

const mockCurrentSong: QueueItem = {
  id: "current-song",
  mediaItem: {
    id: "current-song-id",
    title: "Currently Playing Song",
    artist: "Current Artist",
    duration: 240,
    jellyfinId: "jellyfin-current",
    streamUrl: "http://test.com/stream/current",
  },
  addedBy: "user1",
  addedAt: new Date(),
  position: 0,
  status: "playing",
};

const mockPlaybackState: PlaybackState = {
  isPlaying: true,
  currentTime: 60,
  volume: 75,
  isMuted: false,
  playbackRate: 1.0,
};

describe("HostControls", () => {
  const mockProps = {
    session: mockSession,
    currentSong: mockCurrentSong,
    playbackState: mockPlaybackState,
    onClose: jest.fn(),
    onSkip: jest.fn(),
    onPlaybackControl: jest.fn(),
    onRemoveSong: jest.fn(),
    onReorderQueue: jest.fn(),
    onEmergencyStop: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders host controls with all tabs", () => {
    render(<HostControls {...mockProps} />);

    expect(screen.getByText("Host Controls")).toBeInTheDocument();
    expect(screen.getByText("Playback")).toBeInTheDocument();
    expect(screen.getByText(/Queue \(2\)/)).toBeInTheDocument();
    expect(screen.getByText("Emergency")).toBeInTheDocument();
  });

  it("displays current song information", () => {
    render(<HostControls {...mockProps} />);

    expect(screen.getByText("Currently Playing Song")).toBeInTheDocument();
    expect(screen.getByText("Current Artist")).toBeInTheDocument();
    expect(screen.getByText("Added by user1")).toBeInTheDocument();
  });

  it("handles play/pause button clicks", () => {
    render(<HostControls {...mockProps} />);

    const playPauseButton = screen.getByRole("button", { name: /pause/i });
    fireEvent.click(playPauseButton);

    expect(mockProps.onPlaybackControl).toHaveBeenCalledWith({
      action: "pause",
      userId: "tv-host",
      timestamp: expect.any(Date),
    });
  });

  it("handles skip button clicks", () => {
    render(<HostControls {...mockProps} />);

    const skipButton = screen.getByTitle("Skip Song");
    fireEvent.click(skipButton);

    expect(mockProps.onSkip).toHaveBeenCalled();
  });

  it("handles volume changes", () => {
    render(<HostControls {...mockProps} />);

    const volumeSlider = screen.getByDisplayValue("75");
    fireEvent.change(volumeSlider, { target: { value: "90" } });

    expect(mockProps.onPlaybackControl).toHaveBeenCalledWith({
      action: "volume",
      value: 90,
      userId: "tv-host",
      timestamp: expect.any(Date),
    });
  });

  it("switches to queue tab and displays queue items", () => {
    render(<HostControls {...mockProps} />);

    const queueTab = screen.getByText(/Queue \(2\)/);
    fireEvent.click(queueTab);

    expect(screen.getByText("Test Song 1")).toBeInTheDocument();
    expect(screen.getByText("Test Song 2")).toBeInTheDocument();
    expect(screen.getByText("Test Artist 1")).toBeInTheDocument();
    expect(screen.getByText("Test Artist 2")).toBeInTheDocument();
  });

  it("handles song removal from queue", () => {
    render(<HostControls {...mockProps} />);

    // Switch to queue tab
    const queueTab = screen.getByText(/Queue \(2\)/);
    fireEvent.click(queueTab);

    // Find and click remove button for first song
    const removeButtons = screen.getAllByTitle("Remove from queue");
    fireEvent.click(removeButtons[0]);

    expect(mockProps.onRemoveSong).toHaveBeenCalledWith("queue-1");
  });

  it("switches to emergency tab and shows emergency controls", () => {
    render(<HostControls {...mockProps} />);

    const emergencyTab = screen.getByText("Emergency");
    fireEvent.click(emergencyTab);

    expect(screen.getByText("Emergency Controls")).toBeInTheDocument();
    expect(screen.getByText("Emergency Stop")).toBeInTheDocument();
    expect(screen.getByText("Restart Current Song")).toBeInTheDocument();
    expect(screen.getByText("Mute Audio")).toBeInTheDocument();
  });

  it("handles emergency stop", () => {
    render(<HostControls {...mockProps} />);

    // Switch to emergency tab
    const emergencyTab = screen.getByText("Emergency");
    fireEvent.click(emergencyTab);

    // Click emergency stop
    const emergencyStopButton = screen.getByText("Emergency Stop");
    fireEvent.click(emergencyStopButton);

    expect(mockProps.onPlaybackControl).toHaveBeenCalledWith({
      action: "stop",
      userId: "tv-host",
      timestamp: expect.any(Date),
    });
    expect(mockProps.onEmergencyStop).toHaveBeenCalled();
  });

  it("displays system status in emergency tab", () => {
    render(<HostControls {...mockProps} />);

    // Switch to emergency tab
    const emergencyTab = screen.getByText("Emergency");
    fireEvent.click(emergencyTab);

    expect(screen.getByText("System Status")).toBeInTheDocument();
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // Active users
    expect(screen.getByText("Enabled")).toBeInTheDocument(); // Auto advance
  });

  it("handles close button", () => {
    render(<HostControls {...mockProps} />);

    const closeButton = screen.getByRole("button", { name: "" }); // X button
    fireEvent.click(closeButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it("shows empty queue message when no songs", () => {
    const propsWithEmptyQueue = {
      ...mockProps,
      session: {
        ...mockSession,
        queue: [],
      },
    };

    render(<HostControls {...propsWithEmptyQueue} />);

    // Switch to queue tab
    const queueTab = screen.getByText(/Queue \(0\)/);
    fireEvent.click(queueTab);

    expect(screen.getByText("No songs in queue")).toBeInTheDocument();
  });
});
