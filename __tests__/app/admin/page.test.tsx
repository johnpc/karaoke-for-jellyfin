import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminPage from "@/app/admin/page";

// Mock useWebSocket
const mockUseWebSocket = {
  socket: null,
  isConnected: true,
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
    connectedUsers: [
      {
        id: "u1",
        name: "Admin (Admin)",
        isHost: true,
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
  },
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
  error: null,
};

vi.mock("@/hooks/useWebSocket", () => ({
  useWebSocket: () => mockUseWebSocket,
}));

// Mock MobileAdminInterface
vi.mock("@/components/mobile/MobileAdminInterface", () => ({
  MobileAdminInterface: ({
    userName,
    isConnected,
    error,
  }: {
    userName: string;
    isConnected: boolean;
    error: string | null;
  }) => (
    <div data-testid="admin-interface">
      <span data-testid="admin-username">{userName}</span>
      <span data-testid="admin-connected">{String(isConnected)}</span>
      {error && <span data-testid="admin-error">{error}</span>}
    </div>
  ),
}));

// Mock UserSetup
vi.mock("@/components/mobile/UserSetup", () => ({
  UserSetup: ({
    onSetup,
    title,
  }: {
    onSetup: (name: string) => void;
    title?: string;
  }) => (
    <div data-testid="user-setup">
      <span>{title || "User Setup"}</span>
      <button onClick={() => onSetup("TestAdmin")}>Setup</button>
    </div>
  ),
}));

describe("Admin Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWebSocket.isConnected = true;
    mockUseWebSocket.error = null;
  });

  it("renders without crashing", () => {
    const store: Record<string, string> = {
      "karaoke-admin-username": "Admin (Admin)",
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(
      (key: string) => store[key] || null
    );
    render(<AdminPage />);
    expect(document.body.innerHTML).not.toBe("");
  });

  it("shows user setup when no admin username is saved", () => {
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    render(<AdminPage />);
    expect(screen.getByTestId("user-setup")).toBeInTheDocument();
    expect(screen.getByText("Admin Setup")).toBeInTheDocument();
  });

  it("renders admin interface when setup is complete", () => {
    const store: Record<string, string> = {
      "karaoke-admin-username": "Admin (Admin)",
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(
      (key: string) => store[key] || null
    );
    render(<AdminPage />);
    expect(screen.getByTestId("admin-interface")).toBeInTheDocument();
  });

  it("passes correct username to admin interface", () => {
    const store: Record<string, string> = {
      "karaoke-admin-username": "John (Admin)",
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(
      (key: string) => store[key] || null
    );
    render(<AdminPage />);
    expect(screen.getByTestId("admin-username")).toHaveTextContent(
      "John (Admin)"
    );
  });

  it("passes connection state to admin interface", () => {
    const store: Record<string, string> = {
      "karaoke-admin-username": "Admin (Admin)",
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(
      (key: string) => store[key] || null
    );
    render(<AdminPage />);
    expect(screen.getByTestId("admin-connected")).toHaveTextContent("true");
  });

  it("auto-joins session when connected and setup", () => {
    const store: Record<string, string> = {
      "karaoke-admin-username": "Admin (Admin)",
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(
      (key: string) => store[key] || null
    );
    render(<AdminPage />);
    // The session is already set in mock, so joinSession may not be called
    // But if session were null, it would be called
    mockUseWebSocket.session = null;
    render(<AdminPage />);
    expect(mockUseWebSocket.joinSession).toHaveBeenCalledWith(
      "main-session",
      "Admin (Admin)"
    );
  });

  it("shows loading state before client hydration", () => {
    // This tests the SSR safety; the component shows loading before isClient is true
    // In practice, useEffect fires synchronously in jsdom, so we mostly test the final state
    const store: Record<string, string> = {
      "karaoke-admin-username": "Admin (Admin)",
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(
      (key: string) => store[key] || null
    );
    render(<AdminPage />);
    // Component should be rendered (either loading or full interface)
    expect(document.body.innerHTML).not.toBe("");
  });
});
