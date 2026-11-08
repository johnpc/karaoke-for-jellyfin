import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VideoOverlay } from "@/components/tv/VideoOverlay";
import { MainContent } from "@/components/tv/TVHelpers";
import { QueueItem, PlaybackState } from "@/types";

vi.mock("@/components/tv/LyricsDisplay", () => ({
  LyricsDisplay: () => <div data-testid="lyrics-display">LyricsDisplay</div>,
}));

const useLyricsSync = vi.fn();
vi.mock("@/hooks/useLyricsSync", () => ({
  useLyricsSync: (...args: unknown[]) => useLyricsSync(...args),
}));

const videoSong: QueueItem = {
  id: "q-video",
  mediaItem: {
    id: "media-2",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    duration: 200,
    jellyfinId: "v1",
    streamUrl: "/api/stream/v1?type=video",
    mediaType: "video",
  },
  addedBy: "Freddie",
  addedAt: new Date(),
  position: 0,
  status: "playing",
};

const audioSong: QueueItem = {
  ...videoSong,
  id: "q-audio",
  mediaItem: { ...videoSong.mediaItem, mediaType: undefined },
};

const playbackState: PlaybackState = {
  isPlaying: true,
  currentTime: 50,
  volume: 80,
  isMuted: false,
  playbackRate: 1,
  lyricsOffset: 0,
};

const config = {
  autoplayDelay: 500,
  queueAutoplayDelay: 1000,
  controlsAutoHideDelay: 10000,
  timeUpdateInterval: 2000,
  ratingAnimationDuration: 15000,
  nextSongDuration: 15000,
};

describe("VideoOverlay", () => {
  it("shows song info and progress without any lyric panel", () => {
    render(
      <VideoOverlay
        song={videoSong}
        playbackState={playbackState}
        isConnected={true}
      />
    );

    expect(screen.getByTestId("video-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("current-song-title")).toHaveTextContent(
      "Bohemian Rhapsody"
    );
    expect(screen.getByTestId("current-song-artist")).toHaveTextContent(
      "Queen"
    );
    expect(screen.getByText(/Added by Freddie/)).toBeInTheDocument();
    expect(screen.getByText("0:50 / 3:20")).toBeInTheDocument();
    expect(screen.getByTestId("progress-bar-fill")).toHaveStyle({
      width: "25%",
    });
    expect(screen.queryByTestId("current-lyric")).toBeNull();
    expect(screen.queryByText("Offline")).toBeNull();
    expect(useLyricsSync).not.toHaveBeenCalled();
  });

  it("flags a lost connection and tolerates a missing playback state", () => {
    render(
      <VideoOverlay song={videoSong} playbackState={null} isConnected={false} />
    );
    expect(screen.getByText("Offline")).toBeInTheDocument();
    expect(screen.getByTestId("progress-bar-fill")).toHaveStyle({
      width: "0%",
    });
  });
});

describe("MainContent media routing", () => {
  const props = {
    playbackState,
    isConnected: true,
    queue: [],
    session: null,
    config,
    onRatingComplete: vi.fn(),
    onNextSongComplete: vi.fn(),
  };

  it("renders the video overlay instead of lyrics for video entries", () => {
    render(
      <MainContent
        {...props}
        transitionState={{ displayState: "playing" }}
        currentSong={videoSong}
      />
    );
    expect(screen.getByTestId("video-overlay")).toBeInTheDocument();
    expect(screen.queryByTestId("lyrics-display")).toBeNull();
  });

  it("keeps rendering lyrics for audio entries", () => {
    render(
      <MainContent
        {...props}
        transitionState={{ displayState: "playing" }}
        currentSong={audioSong}
      />
    );
    expect(screen.getByTestId("lyrics-display")).toBeInTheDocument();
    expect(screen.queryByTestId("video-overlay")).toBeNull();
  });
});
