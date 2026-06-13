import React from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RatingAnimation } from "@/components/tv/RatingAnimation";
import { QueueItem, SongRating } from "@/types";

const mockSong: QueueItem = {
  id: "queue-1",
  mediaItem: {
    id: "song-1",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    album: "A Night at the Opera",
    duration: 354,
    jellyfinId: "jellyfin-1",
    streamUrl: "http://test.com/stream/1",
  },
  addedBy: "John",
  addedAt: new Date(),
  position: 0,
  status: "completed",
};

const mockRatingA: SongRating = {
  grade: "A+",
  score: 95,
  message: "Fantastic!",
};

const mockRatingB: SongRating = {
  grade: "B",
  score: 80,
  message: "Great job!",
};

const mockRatingC: SongRating = {
  grade: "C+",
  score: 70,
  message: "Nice try!",
};

describe("RatingAnimation", () => {
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
      <RatingAnimation
        song={mockSong}
        rating={mockRatingA}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByTestId("rating-animation")).toBeInTheDocument();
  });

  it("displays the song title and artist", () => {
    render(
      <RatingAnimation
        song={mockSong}
        rating={mockRatingA}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText(/Bohemian Rhapsody/)).toBeInTheDocument();
    expect(screen.getByText(/Queen/)).toBeInTheDocument();
  });

  it("displays the performer name", () => {
    render(
      <RatingAnimation
        song={mockSong}
        rating={mockRatingA}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText(/Performed by John/)).toBeInTheDocument();
  });

  it("shows spinning phase initially", () => {
    render(
      <RatingAnimation
        song={mockSong}
        rating={mockRatingA}
        onComplete={mockOnComplete}
      />
    );

    // During spinning phase, the rating should not be visible yet
    expect(screen.queryByTestId("performance-rating")).not.toBeInTheDocument();
  });

  it("reveals the rating after spinning phase", () => {
    render(
      <RatingAnimation
        song={mockSong}
        rating={mockRatingA}
        onComplete={mockOnComplete}
      />
    );

    // Advance past the spinning phase (1.5s)
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByTestId("performance-rating")).toBeInTheDocument();
    expect(screen.getByText("A+")).toBeInTheDocument();
    expect(screen.getByText("Fantastic!")).toBeInTheDocument();
  });

  it("displays the score", () => {
    render(
      <RatingAnimation
        song={mockSong}
        rating={mockRatingA}
        onComplete={mockOnComplete}
      />
    );

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByTestId("rating-score")).toHaveTextContent(
      "Score: 95/100"
    );
  });

  it("calls onComplete after duration elapses", () => {
    render(
      <RatingAnimation
        song={mockSong}
        rating={mockRatingA}
        onComplete={mockOnComplete}
        duration={4000}
      />
    );

    act(() => {
      vi.advanceTimersByTime(4300); // duration + 300ms fade out
    });

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it("shows celebration message", () => {
    render(
      <RatingAnimation
        song={mockSong}
        rating={mockRatingA}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText("Great performance!")).toBeInTheDocument();
  });

  it("works with B grade rating", () => {
    render(
      <RatingAnimation
        song={mockSong}
        rating={mockRatingB}
        onComplete={mockOnComplete}
      />
    );

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("Great job!")).toBeInTheDocument();
    expect(screen.getByTestId("rating-score")).toHaveTextContent(
      "Score: 80/100"
    );
  });

  it("works with C grade rating", () => {
    render(
      <RatingAnimation
        song={mockSong}
        rating={mockRatingC}
        onComplete={mockOnComplete}
      />
    );

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByText("C+")).toBeInTheDocument();
    expect(screen.getByText("Nice try!")).toBeInTheDocument();
  });

  it("transitions through all phases correctly", () => {
    render(
      <RatingAnimation
        song={mockSong}
        rating={mockRatingA}
        onComplete={mockOnComplete}
        duration={4000}
      />
    );

    // Phase 1: spinning (0-1.5s)
    expect(screen.queryByText("A+")).not.toBeInTheDocument();

    // Phase 2: revealing (1.5-2.5s)
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByText("A+")).toBeInTheDocument();

    // Phase 3: celebrating (2.5s+)
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("A+")).toBeInTheDocument();
  });

  it("shows no more songs message when nextSong is null", () => {
    render(
      <RatingAnimation
        song={mockSong}
        rating={mockRatingA}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText("No more songs in queue")).toBeInTheDocument();
  });

  it("shows next song info when nextSong is provided", () => {
    const nextSong: QueueItem = {
      id: "next-1",
      mediaItem: {
        id: "media-2",
        title: "Don't Stop Me Now",
        artist: "Queen",
        album: "Jazz",
        duration: 210,
        jellyfinId: "jellyfin-2",
        streamUrl: "http://test.com/stream/2",
      },
      addedBy: "Alice",
      addedAt: new Date(),
      position: 1,
      status: "pending",
    };

    render(
      <RatingAnimation
        song={mockSong}
        rating={mockRatingA}
        nextSong={nextSong}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText("Up Next")).toBeInTheDocument();
    expect(screen.getByText("Don't Stop Me Now")).toBeInTheDocument();
    expect(screen.getByText("Queen")).toBeInTheDocument();
  });
});
