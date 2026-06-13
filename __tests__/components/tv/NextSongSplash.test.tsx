import React from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextSongSplash } from "@/components/tv/NextSongSplash";
import { QueueItem } from "@/types";

// Mock LyricsIndicator
vi.mock("@/components/LyricsIndicator", () => ({
  LyricsIndicator: ({ song }: { song: { hasLyrics?: boolean } }) => (
    <span data-testid="lyrics-indicator">
      {song.hasLyrics ? "Karaoke" : "Audio Only"}
    </span>
  ),
}));

const mockNextSong: QueueItem = {
  id: "queue-1",
  mediaItem: {
    id: "song-1",
    title: "Don't Stop Me Now",
    artist: "Queen",
    album: "Jazz",
    duration: 210,
    jellyfinId: "jellyfin-1",
    streamUrl: "http://test.com/stream/1",
    hasLyrics: true,
  },
  addedBy: "Alice",
  addedAt: new Date(),
  position: 1,
  status: "pending",
};

describe("NextSongSplash", () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders without crashing", () => {
    render(
      <NextSongSplash nextSong={mockNextSong} onComplete={mockOnComplete} />
    );

    expect(screen.getByTestId("next-song-splash")).toBeInTheDocument();
  });

  it("displays the next song title", () => {
    render(
      <NextSongSplash nextSong={mockNextSong} onComplete={mockOnComplete} />
    );

    expect(screen.getByTestId("next-song-title")).toHaveTextContent(
      "Don't Stop Me Now"
    );
  });

  it("displays the next song artist", () => {
    render(
      <NextSongSplash nextSong={mockNextSong} onComplete={mockOnComplete} />
    );

    expect(screen.getByTestId("next-song-artist")).toHaveTextContent(
      "by Queen"
    );
  });

  it("displays the album name when available", () => {
    render(
      <NextSongSplash nextSong={mockNextSong} onComplete={mockOnComplete} />
    );

    expect(screen.getByText(/Jazz/)).toBeInTheDocument();
  });

  it("displays the singer name", () => {
    render(
      <NextSongSplash nextSong={mockNextSong} onComplete={mockOnComplete} />
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("displays formatted song duration", () => {
    render(
      <NextSongSplash nextSong={mockNextSong} onComplete={mockOnComplete} />
    );

    // 210 seconds = 3:30
    expect(screen.getByText("3:30")).toBeInTheDocument();
  });

  it("displays the countdown timer", () => {
    render(
      <NextSongSplash
        nextSong={mockNextSong}
        onComplete={mockOnComplete}
        duration={3000}
      />
    );

    expect(screen.getByTestId("next-song-countdown")).toHaveTextContent("3");
  });

  it("counts down over time", () => {
    render(
      <NextSongSplash
        nextSong={mockNextSong}
        onComplete={mockOnComplete}
        duration={3000}
      />
    );

    expect(screen.getByTestId("next-song-countdown")).toHaveTextContent("3");

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId("next-song-countdown")).toHaveTextContent("2");

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId("next-song-countdown")).toHaveTextContent("1");
  });

  it("shows 'Get ready to sing!' when countdown is active", () => {
    render(
      <NextSongSplash
        nextSong={mockNextSong}
        onComplete={mockOnComplete}
        duration={3000}
      />
    );

    expect(screen.getByTestId("countdown-timer")).toHaveTextContent(
      "Get ready to sing!"
    );
  });

  it("shows 'Here we go!' when countdown reaches 0", () => {
    render(
      <NextSongSplash
        nextSong={mockNextSong}
        onComplete={mockOnComplete}
        duration={3000}
      />
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByTestId("countdown-timer")).toHaveTextContent(
      "Here we go!"
    );
  });

  it("calls onComplete after duration elapses", () => {
    render(
      <NextSongSplash
        nextSong={mockNextSong}
        onComplete={mockOnComplete}
        duration={3000}
      />
    );

    act(() => {
      vi.advanceTimersByTime(3300); // duration + 300ms fade out
    });

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it("shows microphone reminder with singer name", () => {
    render(
      <NextSongSplash nextSong={mockNextSong} onComplete={mockOnComplete} />
    );

    expect(screen.getByText("Grab the microphone, Alice!")).toBeInTheDocument();
  });

  it("shows keyboard shortcut hints", () => {
    render(
      <NextSongSplash nextSong={mockNextSong} onComplete={mockOnComplete} />
    );

    expect(screen.getByText(/Press "S" to skip/)).toBeInTheDocument();
    expect(
      screen.getByText(/Press "Space" to start early/)
    ).toBeInTheDocument();
  });

  it("does not show album when not available", () => {
    const songWithoutAlbum: QueueItem = {
      ...mockNextSong,
      mediaItem: {
        ...mockNextSong.mediaItem,
        album: undefined,
      },
    };

    render(
      <NextSongSplash nextSong={songWithoutAlbum} onComplete={mockOnComplete} />
    );

    expect(screen.queryByText(/from "/)).not.toBeInTheDocument();
  });
});
