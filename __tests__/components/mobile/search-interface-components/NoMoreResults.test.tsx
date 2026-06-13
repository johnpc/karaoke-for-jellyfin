import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NoMoreResults } from "@/components/mobile/search-interface-components/NoMoreResults";

describe("NoMoreResults", () => {
  const defaultProps = {
    hasSearched: true,
    hasMoreResults: false,
    isLoadingMore: false,
    activeTab: "search" as const,
    artistViewMode: "artists" as const,
    playlistViewMode: "playlists" as const,
    artistResults: [{ id: "a1" }],
    albumResults: [{ id: "al1" }, { id: "al2" }],
    songResults: [{ id: "s1" }, { id: "s2" }, { id: "s3" }],
    playlistResults: [],
    selectedArtist: null,
    selectedAlbum: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when hasSearched is false", () => {
    const { container } = render(
      <NoMoreResults {...defaultProps} hasSearched={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when hasMoreResults is true", () => {
    const { container } = render(
      <NoMoreResults {...defaultProps} hasMoreResults={true} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when isLoadingMore is true", () => {
    const { container } = render(
      <NoMoreResults {...defaultProps} isLoadingMore={true} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when no results exist", () => {
    const { container } = render(
      <NoMoreResults
        {...defaultProps}
        artistResults={[]}
        albumResults={[]}
        songResults={[]}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows search results message with counts", () => {
    render(<NoMoreResults {...defaultProps} />);
    expect(
      screen.getByText("Found all results (1 artists, 2 albums, 3 songs)")
    ).toBeInTheDocument();
  });

  it("shows playlist results message", () => {
    render(
      <NoMoreResults
        {...defaultProps}
        activeTab="playlist"
        playlistResults={[{ id: "p1" }, { id: "p2" }]}
      />
    );
    expect(
      screen.getByText("Found all playlists (2 total)")
    ).toBeInTheDocument();
  });

  it("shows artist songs message when artist is selected", () => {
    render(
      <NoMoreResults
        {...defaultProps}
        artistViewMode="songs"
        selectedArtist={{ id: "a1", name: "Queen", jellyfinId: "j1" }}
      />
    );
    expect(
      screen.getByText("Found all songs by Queen (3 total)")
    ).toBeInTheDocument();
  });

  it("shows album songs message when album is selected", () => {
    render(
      <NoMoreResults
        {...defaultProps}
        artistViewMode="songs"
        selectedAlbum={{
          id: "al1",
          name: "Greatest Hits",
          artist: "Queen",
          jellyfinId: "j1",
        }}
      />
    );
    expect(
      screen.getByText("Found all songs in Greatest Hits (3 total)")
    ).toBeInTheDocument();
  });
});
