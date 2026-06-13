import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileAdminInterface } from "@/components/mobile/MobileAdminInterface";
import {
  KaraokeSession,
  QueueItem,
  PlaybackState,
  PlaybackCommand,
} from "@/types";

// Mock CacheStatus component
vi.mock("@/components/CacheStatus", () => ({
  CacheStatus: () => <div data-testid="cache-status">CacheStatus</div>,
}));

// Mock heroicons
vi.mock("@heroicons/react/24/outline", () => ({
  PlayIcon: () => <svg data-testid="play-icon" />,
  PauseIcon: () => <svg data-testid="pause-icon" />,
  ForwardIcon: () => <svg data-testid="forward-icon" />,
  BackwardIcon: () => <svg data-testid="backward-icon" />,
  StopIcon: () => <svg data-testid="stop-icon" />,
  SpeakerWaveIcon: () => <svg data-testid="speaker-wave-icon" />,
  SpeakerXMarkIcon: () => <svg data-testid="speaker-x-icon" />,
  Cog6ToothIcon: () => <svg data-testid="cog-icon" />,
  ExclamationTriangleIcon: () => <svg data-testid="warning-icon" />,
  QueueListIcon: () => <svg data-testid="queue-list-icon" />,
  MusicalNoteIcon: () => <svg data-testid="musical-note-icon" />,
  XMarkIcon: () => <svg data-testid="x-mark-icon" />,
}));

describe("MobileAdminInterface", () => {
  const mockSession: KaraokeSession = {
    id: "main-session",
    name: "Main",
    queue: [],
    currentSong: null,
    playbackState: {
      isPlaying: false,
      currentTime: 0,
      volume: 80,
      isMuted: false,
      playbackRate: 1.0,
      lyricsOffset: 0,
    },
    connectedUsers: [
      {
        id: "u1",
        name: "Admin",
        isHost: true,
        connectedAt: new Date(),
        lastSeen: new Date(),
      },
      {
        id: "u2",
        name: "Singer",
        isHost: false,
        connectedAt: new Date(),
        lastSeen: new Date(),
      },
    ],
    hostControls: {
      autoAdvance: true,
      allowUserSkip: true,
      allowUserRemove: true,
      maxSongsPerUser: 10,
      requireApproval: false,
    },
    settings: {
      displayName: "Main",
      isPublic: true,
      maxUsers: 50,
      lyricsEnabled: true,
      crossfadeEnabled: false,
      crossfadeDuration: 3,
    },
    createdAt: new Date(),
    lastActivity: new Date(),
  };

  const mockPlaybackState: PlaybackState = {
    isPlaying: true,
    currentTime: 45,
    volume: 80,
    isMuted: false,
    playbackRate: 1.0,
    lyricsOffset: 0,
  };

  const mockCurrentSong: QueueItem = {
    id: "q1",
    mediaItem: {
      id: "song-1",
      title: "Bohemian Rhapsody",
      artist: "Queen",
      duration: 354,
      jellyfinId: "jf-1",
      streamUrl: "/api/stream/jf-1",
    },
    addedBy: "Singer",
    addedAt: new Date(),
    position: 0,
    status: "playing",
  };

  const mockQueue: QueueItem[] = [
    {
      id: "q2",
      mediaItem: {
        id: "song-2",
        title: "Don't Stop Me Now",
        artist: "Queen",
        duration: 210,
        jellyfinId: "jf-2",
        streamUrl: "/api/stream/jf-2",
      },
      addedBy: "User2",
      addedAt: new Date(),
      position: 1,
      status: "pending",
    },
  ];

  const defaultProps = {
    session: mockSession,
    currentSong: mockCurrentSong,
    playbackState: mockPlaybackState,
    queue: mockQueue,
    userName: "Admin (Admin)",
    isConnected: true,
    error: null,
    onSkip: vi.fn(),
    onPlaybackControl: vi.fn(),
    onRemoveSong: vi.fn(),
    onReorderQueue: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<MobileAdminInterface {...defaultProps} />);
    expect(screen.getByTestId("admin-interface")).toBeInTheDocument();
  });

  it("shows the Admin Controls header", () => {
    render(<MobileAdminInterface {...defaultProps} />);
    expect(screen.getByText("Admin Controls")).toBeInTheDocument();
  });

  it("shows connected status with username", () => {
    render(<MobileAdminInterface {...defaultProps} />);
    expect(screen.getByText("Connected as Admin (Admin)")).toBeInTheDocument();
  });

  it("shows disconnected status when not connected", () => {
    render(<MobileAdminInterface {...defaultProps} isConnected={false} />);
    expect(screen.getByText("Disconnected")).toBeInTheDocument();
  });

  it("shows error banner when error is present", () => {
    render(<MobileAdminInterface {...defaultProps} error="Connection lost" />);
    expect(screen.getByText("Connection lost")).toBeInTheDocument();
  });

  it("shows current song info", () => {
    render(<MobileAdminInterface {...defaultProps} />);
    expect(screen.getByTestId("current-song-info")).toBeInTheDocument();
    expect(screen.getByText("Bohemian Rhapsody")).toBeInTheDocument();
    expect(screen.getByText("Queen")).toBeInTheDocument();
  });

  it("shows playback controls", () => {
    render(<MobileAdminInterface {...defaultProps} />);
    expect(screen.getByTestId("playback-controls")).toBeInTheDocument();
  });

  it("shows playing status when playing", () => {
    render(<MobileAdminInterface {...defaultProps} />);
    expect(screen.getByTestId("playback-status")).toHaveTextContent("Playing");
  });

  it("shows paused status when paused", () => {
    render(
      <MobileAdminInterface
        {...defaultProps}
        playbackState={{ ...mockPlaybackState, isPlaying: false }}
      />
    );
    expect(screen.getByTestId("playback-status")).toHaveTextContent("Paused");
  });

  it("calls onSkip when skip button is clicked", () => {
    render(<MobileAdminInterface {...defaultProps} />);
    fireEvent.click(screen.getByTestId("skip-button"));
    expect(defaultProps.onSkip).toHaveBeenCalled();
  });

  it("calls onPlaybackControl for play/pause toggle", () => {
    render(<MobileAdminInterface {...defaultProps} />);
    fireEvent.click(screen.getByTestId("play-pause-button"));
    expect(defaultProps.onPlaybackControl).toHaveBeenCalledWith(
      expect.objectContaining({ action: "pause" })
    );
  });

  it("shows queue tab with correct count", () => {
    render(<MobileAdminInterface {...defaultProps} />);
    expect(screen.getByText(/Queue \(1\)/)).toBeInTheDocument();
  });

  it("shows queue items when queue tab is active", () => {
    render(<MobileAdminInterface {...defaultProps} />);
    // Click queue tab
    fireEvent.click(screen.getByText(/Queue \(1\)/));
    expect(screen.getByTestId("queue-management")).toBeInTheDocument();
    expect(screen.getByText("Don't Stop Me Now")).toBeInTheDocument();
  });

  it("shows emergency controls tab", () => {
    render(<MobileAdminInterface {...defaultProps} />);
    fireEvent.click(screen.getByText("Emergency"));
    expect(screen.getByTestId("emergency-controls")).toBeInTheDocument();
    expect(screen.getByTestId("emergency-stop-button")).toBeInTheDocument();
  });

  it("calls onPlaybackControl with stop on emergency stop", () => {
    render(<MobileAdminInterface {...defaultProps} />);
    fireEvent.click(screen.getByText("Emergency"));
    fireEvent.click(screen.getByTestId("emergency-stop-button"));
    expect(defaultProps.onPlaybackControl).toHaveBeenCalledWith(
      expect.objectContaining({ action: "stop" })
    );
  });

  it("shows system status in emergency tab", () => {
    render(<MobileAdminInterface {...defaultProps} />);
    fireEvent.click(screen.getByText("Emergency"));
    expect(screen.getByTestId("system-status")).toBeInTheDocument();
    expect(screen.getByTestId("connection-indicator")).toHaveTextContent(
      "Connected"
    );
  });

  it("shows active user count in system status", () => {
    render(<MobileAdminInterface {...defaultProps} />);
    fireEvent.click(screen.getByText("Emergency"));
    expect(screen.getByTestId("user-count")).toHaveTextContent("2");
  });

  it("shows lyrics timing controls", () => {
    render(<MobileAdminInterface {...defaultProps} />);
    expect(screen.getByTestId("lyrics-timing")).toBeInTheDocument();
  });

  it("adjusts lyrics offset when plus button is clicked", () => {
    render(<MobileAdminInterface {...defaultProps} />);
    fireEvent.click(screen.getByTestId("lyrics-offset-plus"));
    expect(defaultProps.onPlaybackControl).toHaveBeenCalledWith(
      expect.objectContaining({ action: "lyrics-offset", value: 1 })
    );
  });

  it("adjusts lyrics offset when minus button is clicked", () => {
    render(<MobileAdminInterface {...defaultProps} />);
    fireEvent.click(screen.getByTestId("lyrics-offset-minus"));
    expect(defaultProps.onPlaybackControl).toHaveBeenCalledWith(
      expect.objectContaining({ action: "lyrics-offset", value: -1 })
    );
  });
});
