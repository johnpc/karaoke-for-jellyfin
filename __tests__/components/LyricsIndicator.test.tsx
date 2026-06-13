import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LyricsIndicator } from "@/components/LyricsIndicator";
import { MediaItem } from "@/types";

const songWithLyrics: MediaItem = {
  id: "song-1",
  title: "Test Song",
  artist: "Test Artist",
  duration: 240,
  jellyfinId: "jellyfin-1",
  streamUrl: "http://test.com/stream/1",
  lyricsPath: "/lyrics/test.lrc",
  hasLyrics: true,
};

const songWithoutLyrics: MediaItem = {
  id: "song-2",
  title: "Test Song 2",
  artist: "Test Artist 2",
  duration: 180,
  jellyfinId: "jellyfin-2",
  streamUrl: "http://test.com/stream/2",
  hasLyrics: false,
};

const songWithOnlyLyricsPath: MediaItem = {
  id: "song-3",
  title: "Test Song 3",
  artist: "Test Artist 3",
  duration: 200,
  jellyfinId: "jellyfin-3",
  streamUrl: "http://test.com/stream/3",
  lyricsPath: "/lyrics/test3.lrc",
};

describe("LyricsIndicator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<LyricsIndicator song={songWithLyrics} />);

    expect(screen.getByText("Karaoke")).toBeInTheDocument();
  });

  it("shows 'Karaoke' badge when song has lyrics", () => {
    render(<LyricsIndicator song={songWithLyrics} variant="badge" />);

    expect(screen.getByText("Karaoke")).toBeInTheDocument();
    expect(screen.getByTitle("Lyrics available")).toBeInTheDocument();
  });

  it("shows 'Audio Only' badge when song has no lyrics", () => {
    render(<LyricsIndicator song={songWithoutLyrics} variant="badge" />);

    expect(screen.getByText("Audio Only")).toBeInTheDocument();
    expect(screen.getByTitle("No lyrics available")).toBeInTheDocument();
  });

  it("falls back to lyricsPath when hasLyrics is undefined", () => {
    render(<LyricsIndicator song={songWithOnlyLyricsPath} variant="badge" />);

    expect(screen.getByText("Karaoke")).toBeInTheDocument();
  });

  it("shows Audio Only when no hasLyrics and no lyricsPath", () => {
    const songNoLyrics: MediaItem = {
      id: "s",
      title: "T",
      artist: "A",
      duration: 100,
      jellyfinId: "j",
      streamUrl: "",
    };

    render(<LyricsIndicator song={songNoLyrics} variant="badge" />);

    expect(screen.getByText("Audio Only")).toBeInTheDocument();
  });

  it("applies green styling for songs with lyrics", () => {
    render(<LyricsIndicator song={songWithLyrics} variant="badge" />);

    const badge = screen.getByTitle("Lyrics available");
    expect(badge.className).toContain("bg-green-100");
    expect(badge.className).toContain("text-green-800");
  });

  it("applies gray styling for songs without lyrics", () => {
    render(<LyricsIndicator song={songWithoutLyrics} variant="badge" />);

    const badge = screen.getByTitle("No lyrics available");
    expect(badge.className).toContain("bg-gray-100");
    expect(badge.className).toContain("text-gray-600");
  });

  it("renders text variant with 'Karaoke' for songs with lyrics", () => {
    render(<LyricsIndicator song={songWithLyrics} variant="text" />);

    expect(screen.getByText("Karaoke")).toBeInTheDocument();
  });

  it("renders text variant with 'Audio Only' for songs without lyrics", () => {
    render(<LyricsIndicator song={songWithoutLyrics} variant="text" />);

    expect(screen.getByText("Audio Only")).toBeInTheDocument();
  });

  it("renders icon variant for songs with lyrics", () => {
    render(<LyricsIndicator song={songWithLyrics} variant="icon" />);

    const indicator = screen.getByTitle("Lyrics available");
    expect(indicator).toBeInTheDocument();
    expect(indicator.querySelector("svg")).toBeInTheDocument();
  });

  it("renders icon variant for songs without lyrics", () => {
    render(<LyricsIndicator song={songWithoutLyrics} variant="icon" />);

    const indicator = screen.getByTitle("No lyrics available");
    expect(indicator).toBeInTheDocument();
    expect(indicator.querySelector("svg")).toBeInTheDocument();
  });

  it("applies small size classes", () => {
    render(<LyricsIndicator song={songWithLyrics} size="sm" variant="badge" />);

    const badge = screen.getByTitle("Lyrics available");
    expect(badge.className).toContain("px-2");
    expect(badge.className).toContain("text-xs");
  });

  it("applies medium size classes", () => {
    render(<LyricsIndicator song={songWithLyrics} size="md" variant="badge" />);

    const badge = screen.getByTitle("Lyrics available");
    expect(badge.className).toContain("px-2.5");
    expect(badge.className).toContain("text-sm");
  });

  it("applies large size classes", () => {
    render(<LyricsIndicator song={songWithLyrics} size="lg" variant="badge" />);

    const badge = screen.getByTitle("Lyrics available");
    expect(badge.className).toContain("px-3");
    expect(badge.className).toContain("text-base");
  });

  it("applies custom className", () => {
    render(
      <LyricsIndicator
        song={songWithLyrics}
        variant="badge"
        className="custom-class"
      />
    );

    const badge = screen.getByTitle("Lyrics available");
    expect(badge.className).toContain("custom-class");
  });

  it("returns null for unknown variant", () => {
    // TypeScript would normally prevent this, but testing defensive behavior
    const { container } = render(
      <LyricsIndicator song={songWithLyrics} variant={"unknown" as "badge"} />
    );

    // The component returns null when variant doesn't match badge/icon/text
    expect(container.firstChild).toBeNull();
  });
});
