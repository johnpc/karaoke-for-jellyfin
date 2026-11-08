import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MediaTypeBadge } from "@/components/MediaTypeBadge";
import { LyricsIndicator } from "@/components/LyricsIndicator";
import { MediaItem } from "@/types";

const audio: MediaItem = {
  id: "m1",
  title: "Song",
  artist: "Artist",
  duration: 100,
  jellyfinId: "a1",
  streamUrl: "/api/stream/a1",
  hasLyrics: false,
};

const video: MediaItem = {
  ...audio,
  id: "m2",
  jellyfinId: "v1",
  streamUrl: "/api/stream/v1?type=video",
  mediaType: "video",
};

describe("MediaTypeBadge", () => {
  it("renders nothing for audio entries", () => {
    const { container } = render(<MediaTypeBadge song={audio} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a Video badge for video entries", () => {
    render(<MediaTypeBadge song={video} size="md" className="extra" />);
    const badge = screen.getByTestId("video-badge");
    expect(badge).toHaveTextContent("Video");
    expect(badge).toHaveAttribute("title", expect.stringContaining("Karaoke"));
    expect(badge.className).toContain("extra");
    expect(badge.className).toContain("text-sm");
  });
});

describe("LyricsIndicator with video entries", () => {
  it("shows the Video badge instead of 'Audio Only' for videos", () => {
    render(<LyricsIndicator song={video} />);
    expect(screen.getByTestId("video-badge")).toBeInTheDocument();
    expect(screen.queryByText("Audio Only")).toBeNull();
  });

  it("still shows 'Audio Only' for audio without lyrics", () => {
    render(<LyricsIndicator song={audio} />);
    expect(screen.getByText("Audio Only")).toBeInTheDocument();
    expect(screen.queryByTestId("video-badge")).toBeNull();
  });
});
