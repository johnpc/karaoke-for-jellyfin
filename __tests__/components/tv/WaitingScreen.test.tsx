import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WaitingScreen } from "@/components/tv/WaitingScreen";
import { QueueItem, KaraokeSession } from "@/types";

const createQueueItem = (overrides: Partial<QueueItem> = {}): QueueItem => ({
  id: "queue-1",
  mediaItem: {
    id: "song-1",
    title: "Test Song",
    artist: "Test Artist",
    album: "Test Album",
    duration: 240,
    jellyfinId: "jellyfin-1",
    streamUrl: "http://test.com/stream/1",
  },
  addedBy: "John",
  addedAt: new Date(),
  position: 0,
  status: "pending",
  ...overrides,
});

const mockSession: KaraokeSession = {
  id: "session-1",
  name: "Karaoke Night",
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
      id: "user-1",
      name: "John",
      isHost: true,
      connectedAt: new Date(),
      lastSeen: new Date(),
    },
    {
      id: "user-2",
      name: "Jane",
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
    displayName: "Karaoke Night",
    isPublic: true,
    maxUsers: 20,
    lyricsEnabled: true,
    crossfadeEnabled: false,
    crossfadeDuration: 3,
  },
  createdAt: new Date(),
  lastActivity: new Date(),
};

describe("WaitingScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(
      <WaitingScreen queue={[]} session={mockSession} isConnected={true} />
    );

    expect(screen.getByTestId("waiting-screen")).toBeInTheDocument();
  });

  it("displays the app title", () => {
    render(
      <WaitingScreen queue={[]} session={mockSession} isConnected={true} />
    );

    expect(screen.getByTestId("app-title")).toHaveTextContent("Karaoke");
    expect(screen.getByText("For Jellyfin")).toBeInTheDocument();
  });

  it("shows waiting message when queue is empty", () => {
    render(
      <WaitingScreen queue={[]} session={mockSession} isConnected={true} />
    );

    expect(screen.getByTestId("instructions")).toBeInTheDocument();
    expect(
      screen.getByText(/Use your phone to search and add songs/)
    ).toBeInTheDocument();
  });

  it("shows ready message when queue has songs", () => {
    const queue = [createQueueItem()];

    render(
      <WaitingScreen queue={queue} session={mockSession} isConnected={true} />
    );

    expect(screen.getByText(/1 song in the queue/)).toBeInTheDocument();
  });

  it("shows correct plural for multiple songs", () => {
    const queue = [
      createQueueItem({ id: "q1" }),
      createQueueItem({ id: "q2", position: 1 }),
      createQueueItem({ id: "q3", position: 2 }),
    ];

    render(
      <WaitingScreen queue={queue} session={mockSession} isConnected={true} />
    );

    expect(screen.getByText(/3 songs in the queue/)).toBeInTheDocument();
  });

  it("displays next songs preview with song details", () => {
    const queue = [
      createQueueItem({
        id: "q1",
        mediaItem: {
          id: "s1",
          title: "Bohemian Rhapsody",
          artist: "Queen",
          album: "A Night at the Opera",
          duration: 354,
          jellyfinId: "j1",
          streamUrl: "http://test.com/1",
        },
        addedBy: "John",
      }),
    ];

    render(
      <WaitingScreen queue={queue} session={mockSession} isConnected={true} />
    );

    expect(screen.getByText("Bohemian Rhapsody")).toBeInTheDocument();
    expect(screen.getByText("Queen")).toBeInTheDocument();
    expect(screen.getByText("A Night at the Opera")).toBeInTheDocument();
    expect(screen.getByText("5:54")).toBeInTheDocument();
  });

  it("shows max 3 songs in preview and overflow count", () => {
    const queue = [
      createQueueItem({ id: "q1", position: 0 }),
      createQueueItem({ id: "q2", position: 1 }),
      createQueueItem({ id: "q3", position: 2 }),
      createQueueItem({ id: "q4", position: 3 }),
      createQueueItem({ id: "q5", position: 4 }),
    ];

    render(
      <WaitingScreen queue={queue} session={mockSession} isConnected={true} />
    );

    expect(screen.getByText(/\+ 2 more songs in/)).toBeInTheDocument();
  });

  it("displays session info with connected users count", () => {
    render(
      <WaitingScreen queue={[]} session={mockSession} isConnected={true} />
    );

    expect(screen.getByText("Session Info")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // 2 connected users
  });

  it("displays connected user names", () => {
    render(
      <WaitingScreen queue={[]} session={mockSession} isConnected={true} />
    );

    expect(screen.getByText("John")).toBeInTheDocument();
    expect(screen.getByText("Jane")).toBeInTheDocument();
  });

  it("marks host user with (Host) label", () => {
    render(
      <WaitingScreen queue={[]} session={mockSession} isConnected={true} />
    );

    expect(screen.getByText("(Host)")).toBeInTheDocument();
  });

  it("shows connected status when connected", () => {
    render(
      <WaitingScreen queue={[]} session={mockSession} isConnected={true} />
    );

    expect(screen.getByText("Connected & Ready")).toBeInTheDocument();
  });

  it("shows connecting status when not connected", () => {
    render(
      <WaitingScreen queue={[]} session={mockSession} isConnected={false} />
    );

    expect(screen.getByText("Connecting...")).toBeInTheDocument();
  });

  it("does not display session info when session is null", () => {
    render(<WaitingScreen queue={[]} session={null} isConnected={true} />);

    expect(screen.queryByText("Session Info")).not.toBeInTheDocument();
  });

  it("filters out completed songs from count", () => {
    const queue = [
      createQueueItem({ id: "q1", status: "completed" }),
      createQueueItem({ id: "q2", status: "pending" }),
    ];

    render(
      <WaitingScreen queue={queue} session={mockSession} isConnected={true} />
    );

    expect(screen.getByText(/1 song in the queue/)).toBeInTheDocument();
  });
});
