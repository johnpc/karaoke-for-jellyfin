import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoadMoreButton } from "@/components/mobile/search-interface-components/LoadMoreButton";

describe("LoadMoreButton", () => {
  const defaultProps = {
    hasSearched: true,
    hasMoreResults: true,
    isLoadingMore: false,
    isLoading: false,
    activeTab: "search" as const,
    artistViewMode: "artists" as const,
    playlistViewMode: "playlists" as const,
    artistResults: [{ id: "1" }],
    albumResults: [],
    songResults: [],
    playlistResults: [],
    onLoadMore: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Load More button when conditions are met", () => {
    render(<LoadMoreButton {...defaultProps} />);
    expect(screen.getByText("Load More")).toBeInTheDocument();
  });

  it("renders nothing when hasSearched is false", () => {
    const { container } = render(
      <LoadMoreButton {...defaultProps} hasSearched={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when hasMoreResults is false", () => {
    const { container } = render(
      <LoadMoreButton {...defaultProps} hasMoreResults={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when isLoadingMore is true", () => {
    const { container } = render(
      <LoadMoreButton {...defaultProps} isLoadingMore={true} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when isLoading is true", () => {
    const { container } = render(
      <LoadMoreButton {...defaultProps} isLoading={true} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when no results exist for search tab", () => {
    const { container } = render(
      <LoadMoreButton
        {...defaultProps}
        artistResults={[]}
        albumResults={[]}
        songResults={[]}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows button for playlist tab with results", () => {
    render(
      <LoadMoreButton
        {...defaultProps}
        activeTab="playlist"
        playlistResults={[{ id: "p1" }]}
      />
    );
    expect(screen.getByText("Load More")).toBeInTheDocument();
  });

  it("shows button for songs view with results", () => {
    render(
      <LoadMoreButton
        {...defaultProps}
        artistViewMode="songs"
        songResults={[{ id: "s1" }]}
      />
    );
    expect(screen.getByText("Load More")).toBeInTheDocument();
  });

  it("calls onLoadMore when button is clicked", () => {
    const onLoadMore = vi.fn();
    render(<LoadMoreButton {...defaultProps} onLoadMore={onLoadMore} />);

    fireEvent.click(screen.getByText("Load More"));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});
