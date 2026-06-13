import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoadMoreIndicator } from "@/components/mobile/search-interface-components/LoadMoreIndicator";

describe("LoadMoreIndicator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when isLoadingMore is false", () => {
    const { container } = render(
      <LoadMoreIndicator
        isLoadingMore={false}
        activeTab="search"
        artistViewMode="artists"
        playlistViewMode="playlists"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows 'Loading more results...' for search tab with artists view", () => {
    render(
      <LoadMoreIndicator
        isLoadingMore={true}
        activeTab="search"
        artistViewMode="artists"
        playlistViewMode="playlists"
      />
    );
    expect(screen.getByText("Loading more results...")).toBeInTheDocument();
  });

  it("shows 'Loading more playlists...' for playlist tab with playlists view", () => {
    render(
      <LoadMoreIndicator
        isLoadingMore={true}
        activeTab="playlist"
        artistViewMode="artists"
        playlistViewMode="playlists"
      />
    );
    expect(screen.getByText("Loading more playlists...")).toBeInTheDocument();
  });

  it("shows 'Loading more songs...' for songs view", () => {
    render(
      <LoadMoreIndicator
        isLoadingMore={true}
        activeTab="search"
        artistViewMode="songs"
        playlistViewMode="playlists"
      />
    );
    expect(screen.getByText("Loading more songs...")).toBeInTheDocument();
  });
});
