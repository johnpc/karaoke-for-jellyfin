import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueueView } from "@/components/mobile/QueueView";
import { QueueItem, KaraokeSession } from "@/types";

// Mock LyricsIndicator
vi.mock("@/components/LyricsIndicator", () => ({
  LyricsIndicator: ({ song }: { song: { hasLyrics?: boolean } }) => (
    <span data-testid="lyrics-indicator">
      {song.hasLyrics ? "Karaoke" : "Audio Only"}
    </span>
  ),
}));

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
    hasLyrics: true,
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
    allowUserRemove: true,
    maxSongsPerUser: 5,
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

describe("QueueView", () => {
  const mockOnRemoveSong = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(
      <QueueView
        queue={[]}
        currentSong={null}
        onRemoveSong={mockOnRemoveSong}
        userName="John"
        session={mockSession}
      />
    );

    expect(screen.getByText("Queue")).toBeInTheDocument();
  });

  it("shows empty queue message when no pending songs", () => {
    render(
      <QueueView
        queue={[]}
        currentSong={null}
        onRemoveSong={mockOnRemoveSong}
        userName="John"
        session={mockSession}
      />
    );

    expect(screen.getByTestId("empty-queue")).toBeInTheDocument();
    expect(screen.getByText("Queue is empty")).toBeInTheDocument();
    expect(
      screen.getByText("Search for songs to add them to the queue")
    ).toBeInTheDocument();
  });

  it("displays current song with Now Playing section", () => {
    const currentSong = createQueueItem({
      id: "current",
      status: "playing",
      mediaItem: {
        id: "cs",
        title: "Currently Playing Song",
        artist: "Current Artist",
        duration: 180,
        jellyfinId: "j-c",
        streamUrl: "http://test.com/c",
        hasLyrics: true,
      },
      addedBy: "John",
    });

    render(
      <QueueView
        queue={[]}
        currentSong={currentSong}
        onRemoveSong={mockOnRemoveSong}
        userName="John"
        session={mockSession}
      />
    );

    expect(screen.getByTestId("now-playing")).toBeInTheDocument();
    expect(screen.getByText("Now Playing")).toBeInTheDocument();
    expect(screen.getByText("Currently Playing Song")).toBeInTheDocument();
    expect(screen.getByText("Current Artist")).toBeInTheDocument();
  });

  it("shows 'You' instead of username for current user songs in now playing", () => {
    const currentSong = createQueueItem({
      id: "current",
      status: "playing",
      addedBy: "John",
    });

    render(
      <QueueView
        queue={[]}
        currentSong={currentSong}
        onRemoveSong={mockOnRemoveSong}
        userName="John"
        session={mockSession}
      />
    );

    expect(screen.getByText(/Added by You/)).toBeInTheDocument();
  });

  it("shows other user name for their songs in now playing", () => {
    const currentSong = createQueueItem({
      id: "current",
      status: "playing",
      addedBy: "Jane",
    });

    render(
      <QueueView
        queue={[]}
        currentSong={currentSong}
        onRemoveSong={mockOnRemoveSong}
        userName="John"
        session={mockSession}
      />
    );

    expect(screen.getByText(/Added by Jane/)).toBeInTheDocument();
  });

  it("displays pending queue items", () => {
    const queue = [
      createQueueItem({
        id: "q1",
        mediaItem: {
          id: "s1",
          title: "Song One",
          artist: "Artist One",
          duration: 200,
          jellyfinId: "j1",
          streamUrl: "http://test.com/1",
          hasLyrics: true,
        },
        addedBy: "John",
      }),
      createQueueItem({
        id: "q2",
        position: 1,
        mediaItem: {
          id: "s2",
          title: "Song Two",
          artist: "Artist Two",
          duration: 180,
          jellyfinId: "j2",
          streamUrl: "http://test.com/2",
          hasLyrics: false,
        },
        addedBy: "Jane",
      }),
    ];

    render(
      <QueueView
        queue={queue}
        currentSong={null}
        onRemoveSong={mockOnRemoveSong}
        userName="John"
        session={mockSession}
      />
    );

    expect(screen.getByText("Song One")).toBeInTheDocument();
    expect(screen.getByText("Artist One")).toBeInTheDocument();
    expect(screen.getByText("Song Two")).toBeInTheDocument();
    expect(screen.getByText("Artist Two")).toBeInTheDocument();
  });

  it("shows song count in header", () => {
    const queue = [
      createQueueItem({ id: "q1" }),
      createQueueItem({ id: "q2", position: 1 }),
    ];

    render(
      <QueueView
        queue={queue}
        currentSong={null}
        onRemoveSong={mockOnRemoveSong}
        userName="John"
        session={mockSession}
      />
    );

    expect(screen.getByText("2 songs")).toBeInTheDocument();
  });

  it("shows estimated total time", () => {
    const queue = [
      createQueueItem({
        id: "q1",
        mediaItem: {
          id: "s1",
          title: "S1",
          artist: "A",
          duration: 120,
          jellyfinId: "j1",
          streamUrl: "",
        },
      }),
      createQueueItem({
        id: "q2",
        position: 1,
        mediaItem: {
          id: "s2",
          title: "S2",
          artist: "A",
          duration: 180,
          jellyfinId: "j2",
          streamUrl: "",
        },
      }),
    ];

    render(
      <QueueView
        queue={queue}
        currentSong={null}
        onRemoveSong={mockOnRemoveSong}
        userName="John"
        session={mockSession}
      />
    );

    // 300 seconds = 5:00
    expect(screen.getByText("Estimated time: 5:00")).toBeInTheDocument();
  });

  it("shows user song count", () => {
    const queue = [
      createQueueItem({ id: "q1", addedBy: "John" }),
      createQueueItem({ id: "q2", addedBy: "John", position: 1 }),
      createQueueItem({ id: "q3", addedBy: "Jane", position: 2 }),
    ];

    render(
      <QueueView
        queue={queue}
        currentSong={null}
        onRemoveSong={mockOnRemoveSong}
        userName="John"
        session={mockSession}
      />
    );

    expect(screen.getByText(/You have 2 songs in queue/)).toBeInTheDocument();
  });

  it("shows remove button for user own songs", () => {
    const queue = [createQueueItem({ id: "q1", addedBy: "John" })];

    render(
      <QueueView
        queue={queue}
        currentSong={null}
        onRemoveSong={mockOnRemoveSong}
        userName="John"
        session={mockSession}
      />
    );

    expect(screen.getByTestId("remove-song-button")).toBeInTheDocument();
  });

  it("calls onRemoveSong when remove button is clicked", () => {
    const queue = [createQueueItem({ id: "q1", addedBy: "John" })];

    render(
      <QueueView
        queue={queue}
        currentSong={null}
        onRemoveSong={mockOnRemoveSong}
        userName="John"
        session={mockSession}
      />
    );

    fireEvent.click(screen.getByTestId("remove-song-button"));

    expect(mockOnRemoveSong).toHaveBeenCalledWith("q1");
  });

  it("marks user songs with 'Your song' indicator", () => {
    const queue = [createQueueItem({ id: "q1", addedBy: "John" })];

    render(
      <QueueView
        queue={queue}
        currentSong={null}
        onRemoveSong={mockOnRemoveSong}
        userName="John"
        session={mockSession}
      />
    );

    expect(screen.getByText("Your song")).toBeInTheDocument();
  });

  it("shows 'You' for own songs in queue list", () => {
    const queue = [createQueueItem({ id: "q1", addedBy: "John" })];

    render(
      <QueueView
        queue={queue}
        currentSong={null}
        onRemoveSong={mockOnRemoveSong}
        userName="John"
        session={mockSession}
      />
    );

    const queueItem = screen.getByTestId("queue-item");
    expect(queueItem).toHaveTextContent("You");
  });

  it("displays connected users section", () => {
    render(
      <QueueView
        queue={[]}
        currentSong={null}
        onRemoveSong={mockOnRemoveSong}
        userName="John"
        session={mockSession}
      />
    );

    expect(screen.getByText(/Connected/)).toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("Jane")).toBeInTheDocument();
  });

  it("shows host label for host user", () => {
    render(
      <QueueView
        queue={[]}
        currentSong={null}
        onRemoveSong={mockOnRemoveSong}
        userName="John"
        session={mockSession}
      />
    );

    expect(screen.getByText("(Host)")).toBeInTheDocument();
  });

  it("does not show connected users when session is null", () => {
    render(
      <QueueView
        queue={[]}
        currentSong={null}
        onRemoveSong={mockOnRemoveSong}
        userName="John"
        session={null}
      />
    );

    expect(screen.queryByText(/Connected \(/)).not.toBeInTheDocument();
  });

  it("host can remove other users songs", () => {
    const queue = [createQueueItem({ id: "q1", addedBy: "Jane" })];

    render(
      <QueueView
        queue={queue}
        currentSong={null}
        onRemoveSong={mockOnRemoveSong}
        userName="John"
        session={mockSession}
      />
    );

    // John is host, so should be able to remove Jane's songs
    expect(screen.getByTestId("remove-song-button")).toBeInTheDocument();
  });

  it("non-host cannot remove other users songs", () => {
    const queue = [createQueueItem({ id: "q1", addedBy: "John" })];

    render(
      <QueueView
        queue={queue}
        currentSong={null}
        onRemoveSong={mockOnRemoveSong}
        userName="Jane"
        session={mockSession}
      />
    );

    // Jane is not host and it's not her song
    expect(screen.queryByTestId("remove-song-button")).not.toBeInTheDocument();
  });
});
