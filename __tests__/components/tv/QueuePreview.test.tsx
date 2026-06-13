import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueuePreview } from "@/components/tv/QueuePreview";
import { QueueItem } from "@/types";

// Mock LyricsIndicator since it's a dependency
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

describe("QueuePreview", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(
      <QueuePreview queue={[]} currentSong={null} onClose={mockOnClose} />
    );

    expect(screen.getByText("Song Queue")).toBeInTheDocument();
  });

  it("shows empty queue message when no pending songs", () => {
    render(
      <QueuePreview queue={[]} currentSong={null} onClose={mockOnClose} />
    );

    expect(screen.getByText("Queue is empty")).toBeInTheDocument();
    expect(
      screen.getByText("Waiting for songs to be added...")
    ).toBeInTheDocument();
  });

  it("displays current song with Now Playing label", () => {
    const currentSong = createQueueItem({
      id: "current",
      status: "playing",
      mediaItem: {
        id: "cs1",
        title: "Currently Playing",
        artist: "Playing Artist",
        album: "Playing Album",
        duration: 180,
        jellyfinId: "j-current",
        streamUrl: "http://test.com/current",
        hasLyrics: true,
      },
    });

    render(
      <QueuePreview
        queue={[]}
        currentSong={currentSong}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("Now Playing")).toBeInTheDocument();
    expect(screen.getByText("Currently Playing")).toBeInTheDocument();
    expect(screen.getByText("Playing Artist")).toBeInTheDocument();
  });

  it("displays pending songs in the queue", () => {
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
      }),
    ];

    render(
      <QueuePreview queue={queue} currentSong={null} onClose={mockOnClose} />
    );

    expect(screen.getByText("Song One")).toBeInTheDocument();
    expect(screen.getByText("Artist One")).toBeInTheDocument();
    expect(screen.getByText("Song Two")).toBeInTheDocument();
    expect(screen.getByText("Artist Two")).toBeInTheDocument();
  });

  it("shows correct song count and total duration", () => {
    const queue = [
      createQueueItem({
        id: "q1",
        mediaItem: {
          id: "s1",
          title: "Song 1",
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
          title: "Song 2",
          artist: "A",
          duration: 180,
          jellyfinId: "j2",
          streamUrl: "",
        },
      }),
    ];

    render(
      <QueuePreview queue={queue} currentSong={null} onClose={mockOnClose} />
    );

    // 2 songs, total 300 seconds = 5:00
    expect(screen.getByText(/2 songs/)).toBeInTheDocument();
    expect(screen.getByText(/5:00/)).toBeInTheDocument();
  });

  it("shows singular 'song' for single item queue", () => {
    const queue = [createQueueItem()];

    render(
      <QueuePreview queue={queue} currentSong={null} onClose={mockOnClose} />
    );

    expect(screen.getByText(/1 song •/)).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(
      <QueuePreview queue={[]} currentSong={null} onClose={mockOnClose} />
    );

    const closeButton = screen.getByRole("button");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("displays position numbers for queue items", () => {
    const queue = [
      createQueueItem({ id: "q1" }),
      createQueueItem({ id: "q2", position: 1 }),
    ];

    render(
      <QueuePreview queue={queue} currentSong={null} onClose={mockOnClose} />
    );

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("displays addedBy for each song", () => {
    const queue = [
      createQueueItem({ id: "q1", addedBy: "Alice" }),
      createQueueItem({ id: "q2", addedBy: "Bob", position: 1 }),
    ];

    render(
      <QueuePreview queue={queue} currentSong={null} onClose={mockOnClose} />
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("filters out non-pending songs from queue display", () => {
    const queue = [
      createQueueItem({
        id: "q1",
        status: "completed",
        mediaItem: {
          id: "s1",
          title: "Completed Song",
          artist: "A",
          duration: 100,
          jellyfinId: "j1",
          streamUrl: "",
        },
      }),
      createQueueItem({
        id: "q2",
        status: "pending",
        mediaItem: {
          id: "s2",
          title: "Pending Song",
          artist: "B",
          duration: 100,
          jellyfinId: "j2",
          streamUrl: "",
        },
      }),
    ];

    render(
      <QueuePreview queue={queue} currentSong={null} onClose={mockOnClose} />
    );

    expect(screen.queryByText("Completed Song")).not.toBeInTheDocument();
    expect(screen.getByText("Pending Song")).toBeInTheDocument();
  });

  it("shows footer with keyboard shortcut hints", () => {
    render(
      <QueuePreview queue={[]} currentSong={null} onClose={mockOnClose} />
    );

    expect(screen.getByText(/Press Q to toggle queue/)).toBeInTheDocument();
    expect(screen.getByText(/Auto-hide in 10 seconds/)).toBeInTheDocument();
  });
});
