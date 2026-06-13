import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LyricsDisplay } from "@/components/tv/LyricsDisplay";
import { QueueItem, PlaybackState } from "@/types";

// Mock the useLyrics hook
vi.mock("@/hooks/useLyrics", () => ({
  useLyrics: vi.fn(() => ({
    lyricsFile: null,
    syncState: null,
    currentLine: "",
    nextLine: "",
    isLoading: false,
    error: null,
  })),
}));

import { useLyrics } from "@/hooks/useLyrics";
const mockUseLyrics = vi.mocked(useLyrics);

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
    lyricsPath: "/lyrics/bohemian-rhapsody.lrc",
    hasLyrics: true,
  },
  addedBy: "John",
  addedAt: new Date(),
  position: 0,
  status: "playing",
};

const mockPlaybackState: PlaybackState = {
  isPlaying: true,
  currentTime: 45,
  volume: 80,
  isMuted: false,
  playbackRate: 1.0,
  lyricsOffset: 0,
};

describe("LyricsDisplay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLyrics.mockReturnValue({
      lyricsFile: null,
      syncState: null,
      currentLine: "",
      nextLine: "",
      isLoading: false,
      error: null,
    });
  });

  it("renders without crashing", () => {
    render(
      <LyricsDisplay
        song={mockSong}
        playbackState={mockPlaybackState}
        isConnected={true}
      />
    );

    expect(screen.getByTestId("lyrics-display")).toBeInTheDocument();
  });

  it("displays song title and artist", () => {
    render(
      <LyricsDisplay
        song={mockSong}
        playbackState={mockPlaybackState}
        isConnected={true}
      />
    );

    expect(screen.getByTestId("current-song-title")).toHaveTextContent(
      "Bohemian Rhapsody"
    );
    expect(screen.getByTestId("current-song-artist")).toHaveTextContent(
      "Queen"
    );
  });

  it("displays album name when available", () => {
    render(
      <LyricsDisplay
        song={mockSong}
        playbackState={mockPlaybackState}
        isConnected={true}
      />
    );

    expect(screen.getByText("A Night at the Opera")).toBeInTheDocument();
  });

  it("displays who added the song", () => {
    render(
      <LyricsDisplay
        song={mockSong}
        playbackState={mockPlaybackState}
        isConnected={true}
      />
    );

    expect(screen.getByText("Added by John")).toBeInTheDocument();
  });

  it("shows Playing status when isPlaying is true", () => {
    render(
      <LyricsDisplay
        song={mockSong}
        playbackState={mockPlaybackState}
        isConnected={true}
      />
    );

    expect(screen.getByText("Playing")).toBeInTheDocument();
  });

  it("shows Paused status when isPlaying is false", () => {
    const pausedState: PlaybackState = {
      ...mockPlaybackState,
      isPlaying: false,
    };

    render(
      <LyricsDisplay
        song={mockSong}
        playbackState={pausedState}
        isConnected={true}
      />
    );

    expect(screen.getByText("Paused")).toBeInTheDocument();
  });

  it("shows Live status when connected", () => {
    render(
      <LyricsDisplay
        song={mockSong}
        playbackState={mockPlaybackState}
        isConnected={true}
      />
    );

    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("shows Offline status when not connected", () => {
    render(
      <LyricsDisplay
        song={mockSong}
        playbackState={mockPlaybackState}
        isConnected={false}
      />
    );

    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  it("displays current lyrics line when available", () => {
    mockUseLyrics.mockReturnValue({
      lyricsFile: {
        songId: "song-1",
        lines: [{ timestamp: 0, text: "Is this the real life?" }],
        format: "lrc",
      },
      syncState: { currentLine: 0, currentTimestamp: 45000, isActive: true },
      currentLine: "Is this the real life?",
      nextLine: "Is this just fantasy?",
      isLoading: false,
      error: null,
    });

    render(
      <LyricsDisplay
        song={mockSong}
        playbackState={mockPlaybackState}
        isConnected={true}
      />
    );

    expect(screen.getByTestId("current-lyric")).toHaveTextContent(
      "Is this the real life?"
    );
    expect(screen.getByText("Is this just fantasy?")).toBeInTheDocument();
  });

  it("shows loading state when lyrics are loading", () => {
    mockUseLyrics.mockReturnValue({
      lyricsFile: null,
      syncState: null,
      currentLine: "",
      nextLine: "",
      isLoading: true,
      error: null,
    });

    render(
      <LyricsDisplay
        song={mockSong}
        playbackState={mockPlaybackState}
        isConnected={true}
      />
    );

    expect(screen.getByText("Loading lyrics...")).toBeInTheDocument();
  });

  it("shows error message when lyrics fail to load", () => {
    mockUseLyrics.mockReturnValue({
      lyricsFile: null,
      syncState: null,
      currentLine: "",
      nextLine: "",
      isLoading: false,
      error: "Failed to load lyrics",
    });

    render(
      <LyricsDisplay
        song={mockSong}
        playbackState={mockPlaybackState}
        isConnected={true}
      />
    );

    expect(screen.getByText("Failed to load lyrics")).toBeInTheDocument();
  });

  it("shows no lyrics message when lyricsPath is missing", () => {
    const songWithoutLyrics: QueueItem = {
      ...mockSong,
      mediaItem: {
        ...mockSong.mediaItem,
        lyricsPath: undefined,
      },
    };

    render(
      <LyricsDisplay
        song={songWithoutLyrics}
        playbackState={mockPlaybackState}
        isConnected={true}
      />
    );

    expect(
      screen.getByText("No lyrics available - Enjoy the music!")
    ).toBeInTheDocument();
  });

  it("displays formatted time in progress bar", () => {
    render(
      <LyricsDisplay
        song={mockSong}
        playbackState={mockPlaybackState}
        isConnected={true}
      />
    );

    // currentTime is 45 seconds = 0:45
    expect(screen.getByText("0:45")).toBeInTheDocument();
    // duration is 354 seconds = 5:54
    expect(screen.getByText("5:54")).toBeInTheDocument();
  });

  it("shows lyrics metadata when available", () => {
    mockUseLyrics.mockReturnValue({
      lyricsFile: {
        songId: "song-1",
        lines: [],
        format: "lrc",
        metadata: {
          creator: "LyricsBot",
        },
      },
      syncState: null,
      currentLine: "",
      nextLine: "",
      isLoading: false,
      error: null,
    });

    render(
      <LyricsDisplay
        song={mockSong}
        playbackState={mockPlaybackState}
        isConnected={true}
      />
    );

    expect(screen.getByText("Lyrics by: LyricsBot")).toBeInTheDocument();
    expect(screen.getByText("Format: LRC")).toBeInTheDocument();
  });
});
