import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MySongs } from "@/components/mobile/MySongs";
import { SongHistoryEntry } from "@/hooks/useSongHistory";

function makeEntry(
  overrides: Partial<SongHistoryEntry> = {}
): SongHistoryEntry {
  return {
    mediaItem: {
      jellyfinId: "song-1",
      title: "Bohemian Rhapsody",
      artist: "Queen",
      album: "A Night at the Opera",
      duration: 354,
    },
    lastSungAt: new Date().toISOString(),
    isFavorite: false,
    ...overrides,
  };
}

describe("MySongs", () => {
  const mockToggleFavorite = vi.fn();
  const mockAddSong = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows empty state when no history or favorites", () => {
    render(
      <MySongs
        favorites={[]}
        recentHistory={[]}
        onToggleFavorite={mockToggleFavorite}
        onAddSong={mockAddSong}
      />
    );

    expect(screen.getByTestId("my-songs-empty")).toBeInTheDocument();
    expect(screen.getByText("No songs yet")).toBeInTheDocument();
  });

  it("shows history section with songs", () => {
    const entry = makeEntry();
    render(
      <MySongs
        favorites={[]}
        recentHistory={[entry]}
        onToggleFavorite={mockToggleFavorite}
        onAddSong={mockAddSong}
      />
    );

    expect(screen.getByTestId("history-section")).toBeInTheDocument();
    expect(screen.getByText("Bohemian Rhapsody")).toBeInTheDocument();
    expect(screen.getByText("Queen")).toBeInTheDocument();
  });

  it("shows favorites section when favorites exist", () => {
    const entry = makeEntry({ isFavorite: true });
    render(
      <MySongs
        favorites={[entry]}
        recentHistory={[]}
        onToggleFavorite={mockToggleFavorite}
        onAddSong={mockAddSong}
      />
    );

    expect(screen.getByTestId("favorites-section")).toBeInTheDocument();
  });

  it("calls onToggleFavorite when favorite button clicked", () => {
    const entry = makeEntry();
    render(
      <MySongs
        favorites={[]}
        recentHistory={[entry]}
        onToggleFavorite={mockToggleFavorite}
        onAddSong={mockAddSong}
      />
    );

    fireEvent.click(screen.getByTestId("favorite-btn-song-1"));
    expect(mockToggleFavorite).toHaveBeenCalledWith("song-1");
  });

  it("calls onAddSong when requeue button clicked", () => {
    const entry = makeEntry();
    render(
      <MySongs
        favorites={[]}
        recentHistory={[entry]}
        onToggleFavorite={mockToggleFavorite}
        onAddSong={mockAddSong}
      />
    );

    fireEvent.click(screen.getByTestId("requeue-btn-song-1"));
    expect(mockAddSong).toHaveBeenCalledWith(entry.mediaItem);
  });

  it("shows 'Just now' for recent timestamps", () => {
    const entry = makeEntry({ lastSungAt: new Date().toISOString() });
    render(
      <MySongs
        favorites={[]}
        recentHistory={[entry]}
        onToggleFavorite={mockToggleFavorite}
        onAddSong={mockAddSong}
      />
    );

    expect(screen.getByText("Just now")).toBeInTheDocument();
  });

  it("shows minutes ago for timestamps within the hour", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const entry = makeEntry({ lastSungAt: fiveMinAgo });
    render(
      <MySongs
        favorites={[]}
        recentHistory={[entry]}
        onToggleFavorite={mockToggleFavorite}
        onAddSong={mockAddSong}
      />
    );

    expect(screen.getByText("5m ago")).toBeInTheDocument();
  });

  it("shows hours ago for timestamps within the day", () => {
    const threeHoursAgo = new Date(
      Date.now() - 3 * 60 * 60 * 1000
    ).toISOString();
    const entry = makeEntry({ lastSungAt: threeHoursAgo });
    render(
      <MySongs
        favorites={[]}
        recentHistory={[entry]}
        onToggleFavorite={mockToggleFavorite}
        onAddSong={mockAddSong}
      />
    );

    expect(screen.getByText("3h ago")).toBeInTheDocument();
  });

  it("shows days ago for timestamps within the week", () => {
    const twoDaysAgo = new Date(
      Date.now() - 2 * 24 * 60 * 60 * 1000
    ).toISOString();
    const entry = makeEntry({ lastSungAt: twoDaysAgo });
    render(
      <MySongs
        favorites={[]}
        recentHistory={[entry]}
        onToggleFavorite={mockToggleFavorite}
        onAddSong={mockAddSong}
      />
    );

    expect(screen.getByText("2d ago")).toBeInTheDocument();
  });

  it("shows date for timestamps older than a week", () => {
    const twoWeeksAgo = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000
    ).toISOString();
    const entry = makeEntry({ lastSungAt: twoWeeksAgo });
    render(
      <MySongs
        favorites={[]}
        recentHistory={[entry]}
        onToggleFavorite={mockToggleFavorite}
        onAddSong={mockAddSong}
      />
    );

    const timeEl = screen.getByTestId("last-sung-time");
    expect(timeEl.textContent).not.toContain("ago");
  });
});
