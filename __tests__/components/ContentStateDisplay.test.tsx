import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContentStateDisplay } from "@/components/mobile/search-interface-components/ContentStateDisplay";
import { MediaItem, Artist, Album, Playlist } from "@/types";

// Mock child components
vi.mock("@/components/mobile/search-interface-components/", () => ({
  LoadingSpinner: ({ message }: { message: string }) => (
    <div data-testid="loading-spinner">{message}</div>
  ),
  EmptyState: ({
    type,
    hasSearched,
  }: {
    type: string;
    hasSearched: boolean;
  }) => (
    <div data-testid="empty-state" data-type={type} data-searched={hasSearched}>
      Empty
    </div>
  ),
}));

vi.mock("@heroicons/react/24/outline", () => ({
  MagnifyingGlassIcon: ({ className }: { className: string }) => (
    <svg data-testid="search-icon" className={className} />
  ),
}));

describe("ContentStateDisplay", () => {
  const defaultProps = {
    isLoading: false,
    hasSearched: false,
    error: null,
    activeTab: "search" as const,
    artistViewMode: "artists" as const,
    playlistViewMode: "playlists" as const,
    selectedArtist: null,
    selectedAlbum: null,
    selectedPlaylist: null,
    songResults: [] as MediaItem[],
    artistResults: [] as Artist[],
    albumResults: [] as Album[],
    playlistResults: [] as Playlist[],
  };

  describe("Loading state", () => {
    it("shows loading spinner when loading and all results are empty", () => {
      render(<ContentStateDisplay {...defaultProps} isLoading={true} />);
      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });

    it("shows 'Searching...' message for search tab with artists view", () => {
      render(
        <ContentStateDisplay
          {...defaultProps}
          isLoading={true}
          activeTab="search"
          artistViewMode="artists"
        />
      );
      expect(screen.getByTestId("loading-spinner")).toHaveTextContent(
        "Searching..."
      );
    });

    it("shows artist-specific message when selectedArtist is present", () => {
      render(
        <ContentStateDisplay
          {...defaultProps}
          isLoading={true}
          activeTab="search"
          artistViewMode="songs"
          selectedArtist={{ id: "a1", name: "Beatles", jellyfinId: "jf-a1" }}
        />
      );
      expect(screen.getByTestId("loading-spinner")).toHaveTextContent(
        "Finding songs by Beatles..."
      );
    });

    it("shows album-specific message when selectedAlbum is present", () => {
      render(
        <ContentStateDisplay
          {...defaultProps}
          isLoading={true}
          activeTab="search"
          artistViewMode="songs"
          selectedAlbum={{
            id: "al1",
            name: "Abbey Road",
            artist: "Beatles",
            jellyfinId: "jf-al1",
          }}
        />
      );
      expect(screen.getByTestId("loading-spinner")).toHaveTextContent(
        "Finding songs in Abbey Road..."
      );
    });

    it("shows generic finding songs message for songs view without selection", () => {
      render(
        <ContentStateDisplay
          {...defaultProps}
          isLoading={true}
          activeTab="search"
          artistViewMode="songs"
        />
      );
      expect(screen.getByTestId("loading-spinner")).toHaveTextContent(
        "Finding songs..."
      );
    });

    it("shows 'Loading playlists...' for playlist tab with playlists view", () => {
      render(
        <ContentStateDisplay
          {...defaultProps}
          isLoading={true}
          activeTab="playlist"
          playlistViewMode="playlists"
        />
      );
      expect(screen.getByTestId("loading-spinner")).toHaveTextContent(
        "Loading playlists..."
      );
    });

    it("shows playlist-specific loading message for songs view", () => {
      render(
        <ContentStateDisplay
          {...defaultProps}
          isLoading={true}
          activeTab="playlist"
          playlistViewMode="songs"
          selectedPlaylist={{
            id: "p1",
            name: "Party Mix",
            jellyfinId: "jf-p1",
          }}
        />
      );
      expect(screen.getByTestId("loading-spinner")).toHaveTextContent(
        "Loading songs from Party Mix..."
      );
    });

    it("does not show loading spinner when results exist", () => {
      const songResults: MediaItem[] = [
        {
          id: "s1",
          title: "Song",
          artist: "A",
          duration: 180,
          jellyfinId: "j1",
          streamUrl: "/s",
        },
      ];
      const { container } = render(
        <ContentStateDisplay
          {...defaultProps}
          isLoading={true}
          songResults={songResults}
        />
      );
      expect(
        container.querySelector('[data-testid="loading-spinner"]')
      ).toBeNull();
    });
  });

  describe("Error state", () => {
    it("shows error message when error is present", () => {
      render(
        <ContentStateDisplay {...defaultProps} error="Something went wrong" />
      );
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("renders error with red styling", () => {
      render(<ContentStateDisplay {...defaultProps} error="Network error" />);
      const errorElement = screen.getByText("Network error");
      expect(errorElement).toHaveClass("text-red-700");
    });
  });

  describe("Empty state", () => {
    it("shows empty state for search tab with no results after search", () => {
      render(
        <ContentStateDisplay
          {...defaultProps}
          hasSearched={true}
          activeTab="search"
          artistViewMode="artists"
        />
      );
      const emptyState = screen.getByTestId("empty-state");
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveAttribute("data-type", "search");
    });

    it("shows empty state for playlist tab with no results", () => {
      render(
        <ContentStateDisplay
          {...defaultProps}
          hasSearched={true}
          activeTab="playlist"
          playlistViewMode="playlists"
        />
      );
      const emptyState = screen.getByTestId("empty-state");
      expect(emptyState).toHaveAttribute("data-type", "playlist");
    });

    it("shows empty state type 'songs' for songs view mode", () => {
      render(
        <ContentStateDisplay
          {...defaultProps}
          hasSearched={true}
          activeTab="search"
          artistViewMode="songs"
        />
      );
      const emptyState = screen.getByTestId("empty-state");
      expect(emptyState).toHaveAttribute("data-type", "songs");
    });

    it("does not show empty state when not searched yet", () => {
      const { container } = render(
        <ContentStateDisplay {...defaultProps} hasSearched={false} />
      );
      expect(container.querySelector('[data-testid="empty-state"]')).toBeNull();
    });

    it("does not show empty state when results exist in search/artists mode", () => {
      const artistResults: Artist[] = [
        { id: "a1", name: "Beatles", jellyfinId: "jf-a1" },
      ];
      const { container } = render(
        <ContentStateDisplay
          {...defaultProps}
          hasSearched={true}
          activeTab="search"
          artistViewMode="artists"
          artistResults={artistResults}
        />
      );
      expect(container.querySelector('[data-testid="empty-state"]')).toBeNull();
    });

    it("does not show empty state when albums exist in search/artists mode", () => {
      const albumResults: Album[] = [
        {
          id: "al1",
          name: "Abbey Road",
          artist: "Beatles",
          jellyfinId: "jf-al1",
        },
      ];
      const { container } = render(
        <ContentStateDisplay
          {...defaultProps}
          hasSearched={true}
          activeTab="search"
          artistViewMode="artists"
          albumResults={albumResults}
        />
      );
      expect(container.querySelector('[data-testid="empty-state"]')).toBeNull();
    });
  });

  describe("Initial state", () => {
    it("shows initial search prompt when not searched and not playlist tab", () => {
      render(<ContentStateDisplay {...defaultProps} />);
      expect(screen.getByText("Search Music")).toBeInTheDocument();
      expect(
        screen.getByText("Search for artists and songs to add to the queue")
      ).toBeInTheDocument();
    });

    it("shows search icon in initial state", () => {
      render(<ContentStateDisplay {...defaultProps} />);
      expect(screen.getByTestId("search-icon")).toBeInTheDocument();
    });

    it("does not show initial state for playlist tab", () => {
      const { container } = render(
        <ContentStateDisplay {...defaultProps} activeTab="playlist" />
      );
      // For playlist tab and !hasSearched, it returns null (not initial state)
      expect(container.querySelector("h3")).toBeNull();
    });

    it("shows search message regardless of artistViewMode when activeTab is search", () => {
      render(
        <ContentStateDisplay
          {...defaultProps}
          activeTab="search"
          artistViewMode="songs"
          selectedArtist={{ id: "a1", name: "Beatles", jellyfinId: "jf-a1" }}
        />
      );
      // When activeTab === "search", the ternary always selects the first branch
      expect(
        screen.getByText("Search for artists and songs to add to the queue")
      ).toBeInTheDocument();
    });
  });

  describe("Null return", () => {
    it("returns null when loading is false, no error, has results, and has searched", () => {
      const songResults: MediaItem[] = [
        {
          id: "s1",
          title: "Song",
          artist: "A",
          duration: 180,
          jellyfinId: "j1",
          streamUrl: "/s",
        },
      ];
      const { container } = render(
        <ContentStateDisplay
          {...defaultProps}
          hasSearched={true}
          songResults={songResults}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it("returns null for playlist tab when not loading and has playlists", () => {
      const playlistResults: Playlist[] = [
        { id: "p1", name: "My Playlist", jellyfinId: "jf-p1" },
      ];
      const { container } = render(
        <ContentStateDisplay
          {...defaultProps}
          activeTab="playlist"
          playlistViewMode="playlists"
          hasSearched={true}
          playlistResults={playlistResults}
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });
});
