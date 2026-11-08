import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MediaPlayer } from "@/components/tv/MediaPlayer";
import { VideoPlayer } from "@/components/tv/VideoPlayer";
import { QueueItem, PlaybackState } from "@/types";

const audioSong: QueueItem = {
  id: "q-audio",
  mediaItem: {
    id: "media-1",
    title: "Audio Song",
    artist: "Artist",
    duration: 180,
    jellyfinId: "a1",
    streamUrl: "/api/stream/a1",
  },
  addedBy: "Alice",
  addedAt: new Date(),
  position: 0,
  status: "playing",
};

const videoSong: QueueItem = {
  ...audioSong,
  id: "q-video",
  mediaItem: {
    ...audioSong.mediaItem,
    id: "media-2",
    title: "Video Song",
    jellyfinId: "v1",
    streamUrl: "/api/stream/v1?type=video",
    mediaType: "video",
  },
};

const playbackState: PlaybackState = {
  isPlaying: false,
  currentTime: 0,
  volume: 80,
  isMuted: false,
  playbackRate: 1,
  lyricsOffset: 0,
};

const handlers = {
  playbackState,
  onPlaybackControl: vi.fn(),
  onSongEnded: vi.fn(),
  onTimeUpdate: vi.fn(),
};

describe("MediaPlayer", () => {
  it("renders the hidden audio player for audio entries", () => {
    const { container } = render(
      <MediaPlayer song={audioSong} {...handlers} />
    );
    expect(screen.getByTestId("audio-player")).toBeInTheDocument();
    expect(container.querySelector("video")).toBeNull();
  });

  it("renders the audio player when nothing is playing", () => {
    const { container } = render(<MediaPlayer song={null} {...handlers} />);
    expect(screen.getByTestId("audio-player")).toBeInTheDocument();
    expect(container.querySelector("video")).toBeNull();
  });

  it("renders a full-screen video element for video entries", () => {
    const { container } = render(
      <MediaPlayer song={videoSong} {...handlers} />
    );
    const video = screen.getByTestId("video-player") as HTMLVideoElement;
    expect(video.tagName).toBe("VIDEO");
    expect(video).toHaveAttribute("preload", "auto");
    expect(video).toHaveAttribute("aria-label", "Karaoke video player");
    expect(video.getAttribute("src")).toBe("/api/stream/v1?type=video");
    expect(container.querySelector("audio")).toBeNull();
  });
});

describe("VideoPlayer", () => {
  it("shows an error when the entry has no stream URL", () => {
    const broken = {
      ...videoSong,
      mediaItem: { ...videoSong.mediaItem, streamUrl: "" },
    };
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<VideoPlayer song={broken} {...handlers} />);
    expect(screen.getByTestId("video-error")).toHaveTextContent(
      "No stream URL available"
    );
  });

  it("renders without a song", () => {
    const { container } = render(<VideoPlayer song={null} {...handlers} />);
    expect(container.querySelector("video")).toBeInTheDocument();
  });
});
