import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextUpSidebar } from "@/components/tv/NextUpSidebar";
import { QueueItem } from "@/types";

vi.mock("@/components/LyricsIndicator", () => ({
  LyricsIndicator: () => <span data-testid="lyrics-indicator">Lyrics</span>,
}));

const mockQueueItem: QueueItem = {
  id: "qi-1",
  mediaItem: {
    id: "song-1",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    album: "A Night at the Opera",
    duration: 354,
    jellyfinId: "j1",
    streamUrl: "/stream/1",
    hasLyrics: true,
  },
  addedBy: "John",
  addedAt: new Date("2024-01-01"),
  position: 1,
  status: "pending",
};

const mockCurrentSong: QueueItem = {
  id: "qi-0",
  mediaItem: {
    id: "song-0",
    title: "Current Song",
    artist: "Artist",
    duration: 200,
    jellyfinId: "j0",
    streamUrl: "/stream/0",
  },
  addedBy: "Alice",
  addedAt: new Date("2024-01-01"),
  position: 0,
  status: "playing",
};

describe("NextUpSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure not in Cypress test mode
    delete (window as any).Cypress;
  });

  it("renders nothing when queue has no pending items", () => {
    const { container } = render(
      <NextUpSidebar queue={[]} currentSong={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the sidebar when pending items exist", () => {
    render(
      <NextUpSidebar queue={[mockQueueItem]} currentSong={mockCurrentSong} />
    );
    expect(screen.getByTestId("next-up-sidebar")).toBeInTheDocument();
  });

  it("displays the next song title", () => {
    render(
      <NextUpSidebar queue={[mockQueueItem]} currentSong={mockCurrentSong} />
    );
    expect(screen.getByTestId("song-title")).toHaveTextContent(
      "Bohemian Rhapsody"
    );
  });

  it("displays the artist name", () => {
    render(
      <NextUpSidebar queue={[mockQueueItem]} currentSong={mockCurrentSong} />
    );
    expect(screen.getByTestId("song-artist")).toHaveTextContent("Queen");
  });

  it("displays who added the song", () => {
    render(
      <NextUpSidebar queue={[mockQueueItem]} currentSong={mockCurrentSong} />
    );
    expect(screen.getByTestId("added-by")).toHaveTextContent("John");
  });

  it("displays the queue position", () => {
    render(
      <NextUpSidebar queue={[mockQueueItem]} currentSong={mockCurrentSong} />
    );
    expect(screen.getByTestId("queue-position")).toHaveTextContent("1");
  });

  it("filters out non-pending items", () => {
    const queue: QueueItem[] = [
      { ...mockQueueItem, id: "qi-played", status: "completed" },
      { ...mockQueueItem, id: "qi-pending", status: "pending" },
    ];
    render(<NextUpSidebar queue={queue} currentSong={mockCurrentSong} />);
    expect(screen.getByTestId("next-up-sidebar")).toBeInTheDocument();
  });
});
