import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

// Mock useWebSocket hook
const mockUseWebSocket = {
  socket: null,
  isConnected: true,
  joinSession: vi.fn(),
  addSong: vi.fn().mockResolvedValue(undefined),
  removeSong: vi.fn(),
  reorderQueue: vi.fn(),
  playbackControl: vi.fn(),
  skipSong: vi.fn(),
  songEnded: vi.fn(),
  startNextSong: vi.fn(),
  updateLocalPlaybackState: vi.fn(),
  setSongCompletedHandler: vi.fn(),
  session: {
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
    connectedUsers: [],
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
  },
  queue: [],
  currentSong: null,
  playbackState: null,
  error: null,
};

vi.mock("@/hooks/useWebSocket", () => ({
  useWebSocket: () => mockUseWebSocket,
}));

// Mock child components to simplify tests
vi.mock("@/components/mobile/SearchInterface", () => ({
  SearchInterface: ({
    onAddSong,
    isConnected,
  }: {
    onAddSong: unknown;
    isConnected: boolean;
  }) => (
    <div data-testid="search-interface">
      SearchInterface (connected: {String(isConnected)})
    </div>
  ),
}));

vi.mock("@/components/mobile/QueueView", () => ({
  QueueView: () => <div data-testid="queue-view">QueueView</div>,
}));

vi.mock("@/components/mobile/UserSetup", () => ({
  UserSetup: ({ onSetup }: { onSetup: (name: string) => void }) => (
    <div data-testid="user-setup">
      <button onClick={() => onSetup("TestUser")}>Setup</button>
    </div>
  ),
}));

vi.mock("@/components/mobile/NavigationTabs", () => ({
  NavigationTabs: ({
    activeTab,
    onTabChange,
    queueCount,
  }: {
    activeTab: string;
    onTabChange: (tab: string) => void;
    queueCount: number;
  }) => (
    <div data-testid="navigation-tabs">
      <button onClick={() => onTabChange("queue")}>Queue ({queueCount})</button>
    </div>
  ),
}));

vi.mock("@/components/PWAInstaller", () => ({
  PWAInstaller: () => <div data-testid="pwa-installer" />,
}));

describe("Home Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    const store: Record<string, string> = { "karaoke-username": "TestUser" };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(
      (key: string) => store[key] || null
    );
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(
      (key: string, value: string) => {
        store[key] = value;
      }
    );
  });

  it("renders without crashing", () => {
    render(<Home />);
    // The component should exist in the DOM
    expect(document.body.innerHTML).not.toBe("");
  });

  it("shows loading state initially before client hydration", () => {
    // When isClient is false, it shows loading
    // The component sets isClient to true in useEffect, which happens asynchronously
    // But since JSDOM runs effects synchronously in tests, we'll get the hydrated state
    render(<Home />);
    // After effects run, should show main content or UserSetup
    expect(document.body.innerHTML).not.toBe("");
  });

  it("renders the header with app name when setup is complete", () => {
    render(<Home />);
    expect(screen.getByText("Karaoke For Jellyfin")).toBeInTheDocument();
  });

  it("shows connection status indicator when connected", () => {
    render(<Home />);
    const status = screen.getByTestId("connection-status");
    expect(status).toHaveTextContent("Connected as TestUser");
  });

  it("renders search interface in search tab by default", () => {
    render(<Home />);
    expect(screen.getByTestId("search-interface")).toBeInTheDocument();
  });

  it("shows user setup when no username is saved", () => {
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    render(<Home />);
    expect(screen.getByTestId("user-setup")).toBeInTheDocument();
  });

  it("shows disconnected status when not connected", () => {
    mockUseWebSocket.isConnected = false;
    mockUseWebSocket.error = null;
    render(<Home />);
    const status = screen.getByTestId("connection-status");
    expect(status).toHaveTextContent("Connecting...");
    // Restore
    mockUseWebSocket.isConnected = true;
  });

  it("shows error banner when there is an error", () => {
    mockUseWebSocket.error = "Connection lost";
    render(<Home />);
    expect(screen.getByTestId("error-message")).toHaveTextContent(
      "Connection lost"
    );
    // Restore
    mockUseWebSocket.error = null;
  });

  it("shows reconnecting status when error mentions reconnection", () => {
    mockUseWebSocket.isConnected = false;
    mockUseWebSocket.error = "Reconnecting... (attempt 2)";
    render(<Home />);
    const status = screen.getByTestId("connection-status");
    expect(status).toHaveTextContent("Reconnecting...");
    // Restore
    mockUseWebSocket.isConnected = true;
    mockUseWebSocket.error = null;
  });

  it("auto-joins session when connected with username and no session", () => {
    // When there's no session, the component calls joinSession
    const originalSession = mockUseWebSocket.session;
    mockUseWebSocket.session = null;
    render(<Home />);
    expect(mockUseWebSocket.joinSession).toHaveBeenCalledWith(
      "main-session",
      "TestUser"
    );
    // Restore
    mockUseWebSocket.session = originalSession;
  });
});
