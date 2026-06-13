import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import TVDisplay from "@/app/tv/page";

// Mock useWebSocket
const mockUseWebSocket = {
  socket: null,
  isConnected: false,
  joinSession: vi.fn(),
  addSong: vi.fn(),
  removeSong: vi.fn(),
  reorderQueue: vi.fn(),
  playbackControl: vi.fn(),
  skipSong: vi.fn(),
  songEnded: vi.fn(),
  startNextSong: vi.fn(),
  updateLocalPlaybackState: vi.fn(),
  setSongCompletedHandler: vi.fn(),
  session: null,
  queue: [],
  currentSong: null,
  playbackState: null,
  error: null,
};

vi.mock("@/hooks/useWebSocket", () => ({
  useWebSocket: () => mockUseWebSocket,
}));

// Mock useConfig
vi.mock("@/contexts/ConfigContext", () => ({
  useConfig: () => ({
    autoplayDelay: 500,
    queueAutoplayDelay: 1000,
    controlsAutoHideDelay: 10000,
    timeUpdateInterval: 2000,
    ratingAnimationDuration: 15000,
    nextSongDuration: 15000,
  }),
}));

// Mock useLyrics (if used in child components)
vi.mock("@/hooks/useLyrics", () => ({
  useLyrics: () => ({
    lyrics: null,
    currentLine: 0,
    isLoading: false,
    error: null,
  }),
}));

// Mock ratingGenerator
vi.mock("@/lib/ratingGenerator", () => ({
  generateRatingForSong: vi.fn(() => ({
    grade: "A",
    score: 90,
    message: "Great job!",
  })),
}));

// Mock child components
vi.mock("@/components/tv/LyricsDisplay", () => ({
  LyricsDisplay: () => <div data-testid="lyrics-display">LyricsDisplay</div>,
}));

vi.mock("@/components/tv/QueuePreview", () => ({
  QueuePreview: () => <div data-testid="queue-preview">QueuePreview</div>,
}));

vi.mock("@/components/tv/HostControls", () => ({
  HostControls: () => <div data-testid="host-controls">HostControls</div>,
}));

vi.mock("@/components/tv/WaitingScreen", () => ({
  WaitingScreen: () => <div data-testid="waiting-screen">WaitingScreen</div>,
}));

vi.mock("@/components/tv/AudioPlayer", () => ({
  AudioPlayer: () => <div data-testid="audio-player">AudioPlayer</div>,
}));

vi.mock("@/components/tv/NextUpSidebar", () => ({
  NextUpSidebar: () => <div data-testid="next-up-sidebar">NextUpSidebar</div>,
}));

vi.mock("@/components/tv/QRCode", () => ({
  QRCode: () => <div data-testid="qr-code">QRCode</div>,
}));

vi.mock("@/components/tv/RatingAnimation", () => ({
  RatingAnimation: () => (
    <div data-testid="rating-animation">RatingAnimation</div>
  ),
}));

vi.mock("@/components/tv/NextSongSplash", () => ({
  NextSongSplash: () => (
    <div data-testid="next-song-splash">NextSongSplash</div>
  ),
}));

vi.mock("@/components/tv/ApplausePlayer", () => ({
  ApplausePlayer: () => <div data-testid="applause-player">ApplausePlayer</div>,
}));

describe("TV Display Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWebSocket.isConnected = false;
    mockUseWebSocket.session = null;
    mockUseWebSocket.queue = [];
    mockUseWebSocket.currentSong = null;
    mockUseWebSocket.playbackState = null;
    mockUseWebSocket.error = null;
  });

  it("renders without crashing", () => {
    render(<TVDisplay />);
    expect(document.body.innerHTML).not.toBe("");
  });

  it("shows the TV interface container", () => {
    render(<TVDisplay />);
    expect(screen.getByTestId("tv-interface")).toBeInTheDocument();
  });

  it("shows waiting screen when no current song", () => {
    render(<TVDisplay />);
    expect(screen.getByTestId("waiting-screen")).toBeInTheDocument();
  });

  it("shows connection status as disconnected initially", () => {
    render(<TVDisplay />);
    const status = screen.getByTestId("connection-status");
    expect(status).toHaveTextContent("Disconnected");
  });

  it("shows connection status as connected when connected", () => {
    mockUseWebSocket.isConnected = true;
    render(<TVDisplay />);
    const status = screen.getByTestId("connection-status");
    expect(status).toHaveTextContent("Connected");
  });

  it("auto-joins session when connected", () => {
    mockUseWebSocket.isConnected = true;
    render(<TVDisplay />);
    expect(mockUseWebSocket.joinSession).toHaveBeenCalledWith(
      "main-session",
      "TV Display"
    );
  });

  it("shows error banner when error is present", () => {
    mockUseWebSocket.error = "Server disconnected";
    render(<TVDisplay />);
    expect(screen.getByText("Server disconnected")).toBeInTheDocument();
  });

  it("renders audio player component", () => {
    render(<TVDisplay />);
    expect(screen.getByTestId("audio-player")).toBeInTheDocument();
  });

  it("renders next up sidebar", () => {
    render(<TVDisplay />);
    expect(screen.getByTestId("next-up-sidebar")).toBeInTheDocument();
  });

  it("renders QR code", () => {
    render(<TVDisplay />);
    expect(screen.getByTestId("qr-code")).toBeInTheDocument();
  });

  it("renders keyboard shortcuts help text", () => {
    render(<TVDisplay />);
    expect(screen.getByText(/H for controls/)).toBeInTheDocument();
  });

  it("renders applause player", () => {
    render(<TVDisplay />);
    expect(screen.getByTestId("applause-player")).toBeInTheDocument();
  });
});
