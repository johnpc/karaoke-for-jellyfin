import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchContent } from "@/components/mobile/search-interface-components/SearchContent";

vi.mock("@/components/LyricsIndicator", () => ({
  LyricsIndicator: () => <span data-testid="lyrics-indicator">Lyrics</span>,
}));

const defaultProps = {
  activeTab: "search" as const,
  artistViewMode: "artists" as const,
  playlistViewMode: "playlists" as const,
  searchQuery: "",
  selectedArtist: null,
  selectedAlbum: null,
  selectedPlaylist: null,
  songResults: [],
  artistResults: [],
  albumResults: [],
  playlistResults: [],
  isLoading: false,
  isLoadingMore: false,
  hasSearched: false,
  hasMoreResults: false,
  error: null,
  addingSongId: null,
  isConnected: true,
  isArtistSectionCollapsed: false,
  isSongSectionCollapsed: false,
  isAlbumSectionCollapsed: false,
  handleTabChange: vi.fn(),
  handleSearchInputChange: vi.fn(),
  handleSearchSubmit: vi.fn(),
  handleArtistSelect: vi.fn(),
  handleAlbumSelect: vi.fn(),
  handlePlaylistSelect: vi.fn(),
  handleBackToArtists: vi.fn(),
  handleBackToAlbums: vi.fn(),
  handleBackToPlaylists: vi.fn(),
  handleAddSong: vi.fn(),
  handleLoadMore: vi.fn(),
  setIsArtistSectionCollapsed: vi.fn(),
  setIsSongSectionCollapsed: vi.fn(),
  setIsAlbumSectionCollapsed: vi.fn(),
  formatDuration: (seconds: number) =>
    `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`,
  getPlaceholderText: () => "Search songs, artists...",
};

describe("SearchContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<SearchContent {...defaultProps} />);
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByText("Playlists")).toBeInTheDocument();
  });

  it("renders search input", () => {
    render(<SearchContent {...defaultProps} />);
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });

  it("shows initial state prompt when not searched", () => {
    render(<SearchContent {...defaultProps} />);
    expect(screen.getByText("Search Music")).toBeInTheDocument();
    expect(
      screen.getByText("Search for artists and songs to add to the queue")
    ).toBeInTheDocument();
  });

  it("shows loading spinner when loading with no results", () => {
    render(
      <SearchContent {...defaultProps} isLoading={true} hasSearched={true} />
    );
    expect(screen.getByTestId("search-loading")).toBeInTheDocument();
  });

  it("shows error message when error exists", () => {
    render(<SearchContent {...defaultProps} error="Connection failed" />);
    expect(screen.getByText("Connection failed")).toBeInTheDocument();
  });

  it("shows back button in artist songs view", () => {
    render(
      <SearchContent
        {...defaultProps}
        artistViewMode="songs"
        selectedArtist={{ id: "a1", name: "Queen", jellyfinId: "j1" }}
      />
    );
    expect(screen.getByTestId("back-button")).toBeInTheDocument();
    expect(screen.getByText("Back to Artists")).toBeInTheDocument();
  });

  it("shows back button in playlist songs view", () => {
    render(
      <SearchContent
        {...defaultProps}
        activeTab="playlist"
        playlistViewMode="songs"
        selectedPlaylist={{ id: "p1", name: "Party", jellyfinId: "j1" }}
      />
    );
    expect(screen.getByTestId("back-button")).toBeInTheDocument();
    expect(screen.getByText("Back to Playlists")).toBeInTheDocument();
  });

  it("hides search form for playlist list view", () => {
    render(
      <SearchContent
        {...defaultProps}
        activeTab="playlist"
        playlistViewMode="playlists"
      />
    );
    expect(screen.queryByTestId("search-input")).not.toBeInTheDocument();
  });

  it("calls handleSearchInputChange when typing", () => {
    const handleSearchInputChange = vi.fn();
    render(
      <SearchContent
        {...defaultProps}
        handleSearchInputChange={handleSearchInputChange}
      />
    );

    fireEvent.change(screen.getByTestId("search-input"), {
      target: { value: "Queen" },
    });
    expect(handleSearchInputChange).toHaveBeenCalled();
  });

  it("shows search results when hasSearched and results exist", () => {
    render(
      <SearchContent
        {...defaultProps}
        hasSearched={true}
        artistResults={[{ id: "a1", name: "Queen", jellyfinId: "j1" }]}
      />
    );
    expect(screen.getByTestId("search-results")).toBeInTheDocument();
  });
});
