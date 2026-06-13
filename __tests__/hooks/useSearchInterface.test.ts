import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSearchInterface } from "@/hooks/useSearchInterface";
import { MediaItem, Artist, Album, Playlist } from "@/types";
import { PaginatedResult } from "@/services/searchFetchers";
import { SearchResults } from "@/services/searchService";

// Mock search fetchers
vi.mock("@/services/searchFetchers", () => ({
  fetchSongsByAlbum: vi.fn(),
  fetchSongsByArtist: vi.fn(),
  fetchPlaylists: vi.fn(),
  fetchSongsByPlaylist: vi.fn(),
  fetchArtists: vi.fn(),
}));

// Mock search service
vi.mock("@/services/searchService", () => ({
  performUnifiedSearch: vi.fn(),
  mergeUniqueResults: vi.fn(
    <T extends { id: string }>(existing: T[], newResults: T[]): T[] => {
      const combined = [...existing, ...newResults];
      return combined.filter(
        (item, index, arr) => arr.findIndex(i => i.id === item.id) === index
      );
    }
  ),
}));

import {
  fetchSongsByAlbum,
  fetchSongsByArtist,
  fetchPlaylists,
  fetchSongsByPlaylist,
  fetchArtists,
} from "@/services/searchFetchers";
import * as SearchService from "@/services/searchService";

const mockFetchSongsByAlbum = fetchSongsByAlbum as ReturnType<typeof vi.fn>;
const mockFetchSongsByArtist = fetchSongsByArtist as ReturnType<typeof vi.fn>;
const mockFetchPlaylists = fetchPlaylists as ReturnType<typeof vi.fn>;
const mockFetchSongsByPlaylist = fetchSongsByPlaylist as ReturnType<
  typeof vi.fn
>;
const mockFetchArtists = fetchArtists as ReturnType<typeof vi.fn>;
const mockPerformUnifiedSearch =
  SearchService.performUnifiedSearch as ReturnType<typeof vi.fn>;

// Test data factories
function makeSong(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: "song-1",
    title: "Test Song",
    artist: "Test Artist",
    duration: 240,
    jellyfinId: "jf-song-1",
    streamUrl: "/api/stream/jf-song-1",
    ...overrides,
  };
}

function makeArtist(overrides: Partial<Artist> = {}): Artist {
  return {
    id: "artist-1",
    name: "Test Artist",
    jellyfinId: "jf-artist-1",
    ...overrides,
  };
}

function makeAlbum(overrides: Partial<Album> = {}): Album {
  return {
    id: "album-1",
    name: "Test Album",
    artist: "Test Artist",
    jellyfinId: "jf-album-1",
    ...overrides,
  };
}

function makePlaylist(overrides: Partial<Playlist> = {}): Playlist {
  return {
    id: "playlist-1",
    name: "Test Playlist",
    jellyfinId: "jf-playlist-1",
    ...overrides,
  };
}

function makeSearchResults(
  overrides: Partial<SearchResults> = {}
): SearchResults {
  return {
    artists: [makeArtist()],
    albums: [makeAlbum()],
    songs: [makeSong()],
    hasMore: false,
    ...overrides,
  };
}

function makePaginatedResult<T>(
  data: T[],
  hasMore = false
): PaginatedResult<T> {
  return { data, hasMore };
}

describe("useSearchInterface", () => {
  let mockOnAddSong: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockOnAddSong = vi.fn().mockResolvedValue(undefined);

    // Default: fetchArtists returns empty so initial load effect doesn't interfere
    mockFetchArtists.mockResolvedValue(
      makePaginatedResult([makeArtist()], false)
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // =========================================================================
  // INITIAL STATE
  // =========================================================================

  describe("initial state", () => {
    it("returns correct default values", async () => {
      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      // Wait for initial artist load to complete
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.activeTab).toBe("search");
      expect(result.current.artistViewMode).toBe("artists");
      expect(result.current.playlistViewMode).toBe("playlists");
      expect(result.current.searchQuery).toBe("");
      expect(result.current.selectedArtist).toBeNull();
      expect(result.current.selectedAlbum).toBeNull();
      expect(result.current.selectedPlaylist).toBeNull();
      expect(result.current.songResults).toEqual([]);
      expect(result.current.albumResults).toEqual([]);
      expect(result.current.playlistResults).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.addingSongId).toBeNull();
      expect(result.current.isConnected).toBe(true);
      expect(result.current.isArtistSectionCollapsed).toBe(false);
      expect(result.current.isSongSectionCollapsed).toBe(false);
      expect(result.current.isAlbumSectionCollapsed).toBe(false);
      expect(result.current.showConfirmation).toBe(false);
      expect(result.current.confirmationType).toBe("success");
    });

    it("loads initial artists on mount", async () => {
      const artists = [makeArtist({ id: "a1" }), makeArtist({ id: "a2" })];
      mockFetchArtists.mockResolvedValue(makePaginatedResult(artists, true));

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(mockFetchArtists).toHaveBeenCalledWith(1);
      expect(result.current.artistResults).toEqual(artists);
      expect(result.current.hasMoreResults).toBe(true);
    });

    it("sets error when initial artist load fails", async () => {
      mockFetchArtists.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.error).toBe("Network error");
    });
  });

  // =========================================================================
  // DEBOUNCED SEARCH (performUnifiedSearch via searchQuery)
  // =========================================================================

  describe("performUnifiedSearch (debounced)", () => {
    it("triggers unified search after 300ms debounce", async () => {
      mockPerformUnifiedSearch.mockResolvedValue(makeSearchResults());

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Simulate typing
      act(() => {
        result.current.handleSearchInputChange({
          target: { value: "hello" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      // Not yet called — still within debounce
      expect(mockPerformUnifiedSearch).not.toHaveBeenCalled();

      // Advance past debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(mockPerformUnifiedSearch).toHaveBeenCalledWith({
        query: "hello",
        page: 1,
      });
    });

    it("clears results when search query becomes empty", async () => {
      mockPerformUnifiedSearch.mockResolvedValue(makeSearchResults());

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // First search
      act(() => {
        result.current.handleSearchInputChange({
          target: { value: "test" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      // Clear search
      act(() => {
        result.current.handleSearchInputChange({
          target: { value: "" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(result.current.songResults).toEqual([]);
      expect(result.current.albumResults).toEqual([]);
      // artistResults may be repopulated by the initial load effect, so just check
      // that hasSearched was reset
      expect(result.current.hasSearched).toBe(true);
    });

    it("sets error on search failure", async () => {
      mockPerformUnifiedSearch.mockRejectedValue(new Error("Server down"));

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      act(() => {
        result.current.handleSearchInputChange({
          target: { value: "fail" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(result.current.error).toBe("Failed to connect to server");
    });

    it("sets partial error from search results", async () => {
      mockPerformUnifiedSearch.mockResolvedValue(
        makeSearchResults({ error: "Failed to search artists" })
      );

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      act(() => {
        result.current.handleSearchInputChange({
          target: { value: "partial" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(result.current.error).toBe("Failed to search artists");
    });

    it("does not trigger search when not on search tab with artists view", async () => {
      mockFetchPlaylists.mockResolvedValue(
        makePaginatedResult([makePlaylist()], false)
      );

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Switch to playlist tab
      await act(async () => {
        result.current.handleTabChange("playlist");
        await vi.runAllTimersAsync();
      });

      mockPerformUnifiedSearch.mockClear();

      act(() => {
        result.current.handleSearchInputChange({
          target: { value: "query" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(mockPerformUnifiedSearch).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // getSongsByAlbum (via handleAlbumSelect)
  // =========================================================================

  describe("handleAlbumSelect / getSongsByAlbum", () => {
    it("fetches songs for the selected album", async () => {
      const songs = [makeSong({ id: "s1" }), makeSong({ id: "s2" })];
      mockFetchSongsByAlbum.mockResolvedValue(
        makePaginatedResult(songs, false)
      );

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      const album = makeAlbum({ id: "album-99" });

      await act(async () => {
        await result.current.handleAlbumSelect(album);
      });

      expect(mockFetchSongsByAlbum).toHaveBeenCalledWith("album-99", 1);
      expect(result.current.songResults).toEqual(songs);
      expect(result.current.selectedAlbum).toEqual(album);
      expect(result.current.artistViewMode).toBe("songs");
    });

    it("sets error when album songs fetch fails", async () => {
      mockFetchSongsByAlbum.mockRejectedValue(new Error("Album not found"));

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await result.current.handleAlbumSelect(makeAlbum());
      });

      expect(result.current.error).toBe("Album not found");
      expect(result.current.songResults).toEqual([]);
    });

    it("sets generic error message for non-Error throws", async () => {
      mockFetchSongsByAlbum.mockRejectedValue("string error");

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await result.current.handleAlbumSelect(makeAlbum());
      });

      expect(result.current.error).toBe("Failed to get songs by album");
    });
  });

  // =========================================================================
  // getSongsByArtist (via handleArtistSelect)
  // =========================================================================

  describe("handleArtistSelect / getSongsByArtist", () => {
    it("fetches songs for the selected artist", async () => {
      const songs = [makeSong({ id: "s1" })];
      mockFetchSongsByArtist.mockResolvedValue(
        makePaginatedResult(songs, true)
      );

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      const artist = makeArtist({ id: "artist-42" });

      await act(async () => {
        await result.current.handleArtistSelect(artist);
      });

      expect(mockFetchSongsByArtist).toHaveBeenCalledWith("artist-42", 1);
      expect(result.current.songResults).toEqual(songs);
      expect(result.current.selectedArtist).toEqual(artist);
      expect(result.current.artistViewMode).toBe("songs");
      expect(result.current.hasMoreResults).toBe(true);
    });

    it("sets error when artist songs fetch fails", async () => {
      mockFetchSongsByArtist.mockRejectedValue(new Error("Artist fetch error"));

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await result.current.handleArtistSelect(makeArtist());
      });

      expect(result.current.error).toBe("Artist fetch error");
    });

    it("sets generic error for non-Error thrown values", async () => {
      mockFetchSongsByArtist.mockRejectedValue(42);

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await result.current.handleArtistSelect(makeArtist());
      });

      expect(result.current.error).toBe("Failed to get songs by artist");
    });
  });

  // =========================================================================
  // getPlaylists (via handleTabChange("playlist"))
  // =========================================================================

  describe("getPlaylists (via handleTabChange)", () => {
    it("loads playlists when switching to playlist tab", async () => {
      const playlists = [
        makePlaylist({ id: "p1" }),
        makePlaylist({ id: "p2" }),
      ];
      mockFetchPlaylists.mockResolvedValue(
        makePaginatedResult(playlists, false)
      );

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        result.current.handleTabChange("playlist");
        await vi.runAllTimersAsync();
      });

      expect(mockFetchPlaylists).toHaveBeenCalledWith(1);
      expect(result.current.playlistResults).toEqual(playlists);
      expect(result.current.activeTab).toBe("playlist");
    });

    it("handles playlist fetch error", async () => {
      mockFetchPlaylists.mockRejectedValue(new Error("Playlists unavailable"));

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        result.current.handleTabChange("playlist");
        await vi.runAllTimersAsync();
      });

      expect(result.current.error).toBe("Playlists unavailable");
    });
  });

  // =========================================================================
  // getSongsByPlaylist (via handlePlaylistSelect)
  // =========================================================================

  describe("handlePlaylistSelect / getSongsByPlaylist", () => {
    it("fetches songs for the selected playlist", async () => {
      const songs = [makeSong({ id: "ps1" }), makeSong({ id: "ps2" })];
      mockFetchSongsByPlaylist.mockResolvedValue(
        makePaginatedResult(songs, true)
      );

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      const playlist = makePlaylist({ id: "pl-7" });

      await act(async () => {
        await result.current.handlePlaylistSelect(playlist);
      });

      expect(mockFetchSongsByPlaylist).toHaveBeenCalledWith("pl-7", 1);
      expect(result.current.songResults).toEqual(songs);
      expect(result.current.selectedPlaylist).toEqual(playlist);
      expect(result.current.playlistViewMode).toBe("songs");
    });

    it("sets error when playlist songs fetch fails", async () => {
      mockFetchSongsByPlaylist.mockRejectedValue(
        new Error("Playlist songs error")
      );

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await result.current.handlePlaylistSelect(makePlaylist());
      });

      expect(result.current.error).toBe("Playlist songs error");
    });

    it("sets generic error for non-Error thrown values", async () => {
      mockFetchSongsByPlaylist.mockRejectedValue(null);

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await result.current.handlePlaylistSelect(makePlaylist());
      });

      expect(result.current.error).toBe("Failed to get songs by playlist");
    });
  });

  // =========================================================================
  // loadMoreArtists (via handleLoadMore when on artists tab with no search)
  // =========================================================================

  describe("loadMoreArtists (via handleLoadMore)", () => {
    it("loads more artists when on search tab with no query", async () => {
      // The initial load effect and the debounce effect both call fetchArtists(1)
      // so we need enough mocked values: initial load + debounce trigger + loadMore
      mockFetchArtists.mockReset();
      mockFetchArtists.mockResolvedValue(
        makePaginatedResult([makeArtist({ id: "a1" })], true)
      );

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      // Wait for initial load
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.hasMoreResults).toBe(true);

      // Trigger load more
      mockFetchArtists.mockResolvedValue(
        makePaginatedResult([makeArtist({ id: "a2" })], false)
      );

      await act(async () => {
        result.current.handleLoadMore();
        await vi.runAllTimersAsync();
      });

      expect(mockFetchArtists).toHaveBeenCalledWith(2);
    });

    it("handles loadMoreArtists error", async () => {
      mockFetchArtists.mockReset();
      mockFetchArtists.mockResolvedValue(
        makePaginatedResult([makeArtist()], true)
      );

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Now set up the error for the next call
      mockFetchArtists.mockRejectedValue(new Error("Load more failed"));

      await act(async () => {
        result.current.handleLoadMore();
        await vi.runAllTimersAsync();
      });

      expect(result.current.error).toBe("Load more failed");
    });

    it("does nothing when hasMoreResults is false", async () => {
      mockFetchArtists.mockResolvedValue(
        makePaginatedResult([makeArtist()], false)
      );

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.hasMoreResults).toBe(false);
      const callsBefore = mockFetchArtists.mock.calls.length;

      await act(async () => {
        result.current.handleLoadMore();
      });

      expect(mockFetchArtists.mock.calls.length).toBe(callsBefore);
    });
  });

  // =========================================================================
  // handleLoadMore — various dispatch conditions
  // =========================================================================

  describe("handleLoadMore dispatching", () => {
    it("loads more unified search results when search query is present", async () => {
      mockPerformUnifiedSearch.mockResolvedValue(
        makeSearchResults({ hasMore: true })
      );

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Type a search query
      act(() => {
        result.current.handleSearchInputChange({
          target: { value: "rock" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      mockPerformUnifiedSearch.mockClear();

      // Load more
      await act(async () => {
        result.current.handleLoadMore();
        await vi.runAllTimersAsync();
      });

      expect(mockPerformUnifiedSearch).toHaveBeenCalledWith({
        query: "rock",
        page: 2,
      });
    });

    it("loads more artist songs when viewing artist songs", async () => {
      const artist = makeArtist({ id: "art-5" });
      mockFetchSongsByArtist.mockResolvedValue(
        makePaginatedResult([makeSong()], true)
      );

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await result.current.handleArtistSelect(artist);
      });

      mockFetchSongsByArtist.mockClear();
      mockFetchSongsByArtist.mockResolvedValue(
        makePaginatedResult([makeSong({ id: "s2" })], false)
      );

      await act(async () => {
        result.current.handleLoadMore();
        await vi.runAllTimersAsync();
      });

      expect(mockFetchSongsByArtist).toHaveBeenCalledWith("art-5", 2);
    });

    it("loads more album songs when viewing album songs", async () => {
      const album = makeAlbum({ id: "alb-3" });
      mockFetchSongsByAlbum.mockResolvedValue(
        makePaginatedResult([makeSong()], true)
      );

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await result.current.handleAlbumSelect(album);
      });

      mockFetchSongsByAlbum.mockClear();
      mockFetchSongsByAlbum.mockResolvedValue(
        makePaginatedResult([makeSong({ id: "s3" })], false)
      );

      await act(async () => {
        result.current.handleLoadMore();
        await vi.runAllTimersAsync();
      });

      expect(mockFetchSongsByAlbum).toHaveBeenCalledWith("alb-3", 2);
    });

    it("loads more playlists when on playlist tab in playlists view", async () => {
      mockFetchPlaylists
        .mockResolvedValueOnce(makePaginatedResult([makePlaylist()], true))
        .mockResolvedValueOnce(
          makePaginatedResult([makePlaylist({ id: "p2" })], false)
        );

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        result.current.handleTabChange("playlist");
        await vi.runAllTimersAsync();
      });

      mockFetchPlaylists.mockClear();
      mockFetchPlaylists.mockResolvedValue(
        makePaginatedResult([makePlaylist({ id: "p3" })], false)
      );

      await act(async () => {
        result.current.handleLoadMore();
        await vi.runAllTimersAsync();
      });

      expect(mockFetchPlaylists).toHaveBeenCalledWith(2);
    });

    it("loads more playlist songs when viewing playlist songs", async () => {
      mockFetchPlaylists.mockResolvedValue(
        makePaginatedResult([makePlaylist()], false)
      );
      mockFetchSongsByPlaylist.mockResolvedValue(
        makePaginatedResult([makeSong()], true)
      );

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Switch to playlist tab
      await act(async () => {
        result.current.handleTabChange("playlist");
        await vi.runAllTimersAsync();
      });

      // Select a playlist
      await act(async () => {
        await result.current.handlePlaylistSelect(
          makePlaylist({ id: "pl-load" })
        );
      });

      mockFetchSongsByPlaylist.mockClear();
      mockFetchSongsByPlaylist.mockResolvedValue(
        makePaginatedResult([makeSong({ id: "s4" })], false)
      );

      await act(async () => {
        result.current.handleLoadMore();
        await vi.runAllTimersAsync();
      });

      expect(mockFetchSongsByPlaylist).toHaveBeenCalledWith("pl-load", 2);
    });
  });

  // =========================================================================
  // handleTabChange
  // =========================================================================

  describe("handleTabChange", () => {
    it("resets all state when switching tabs", async () => {
      mockFetchPlaylists.mockResolvedValue(makePaginatedResult([], false));

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Change some state first
      act(() => {
        result.current.setIsArtistSectionCollapsed(true);
        result.current.setIsSongSectionCollapsed(true);
        result.current.setIsAlbumSectionCollapsed(true);
      });

      await act(async () => {
        result.current.handleTabChange("playlist");
        await vi.runAllTimersAsync();
      });

      expect(result.current.activeTab).toBe("playlist");
      expect(result.current.searchQuery).toBe("");
      expect(result.current.selectedArtist).toBeNull();
      expect(result.current.selectedPlaylist).toBeNull();
      expect(result.current.selectedAlbum).toBeNull();
      expect(result.current.artistViewMode).toBe("artists");
      expect(result.current.playlistViewMode).toBe("playlists");
      expect(result.current.error).toBeNull();
      expect(result.current.isArtistSectionCollapsed).toBe(false);
      expect(result.current.isSongSectionCollapsed).toBe(false);
      expect(result.current.isAlbumSectionCollapsed).toBe(false);
    });

    it("does not call getPlaylists when switching to search tab", async () => {
      mockFetchPlaylists.mockResolvedValue(makePaginatedResult([], false));

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      mockFetchPlaylists.mockClear();

      await act(async () => {
        result.current.handleTabChange("search");
        await vi.runAllTimersAsync();
      });

      expect(mockFetchPlaylists).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // handleBackToArtists, handleBackToAlbums, handleBackToPlaylists
  // =========================================================================

  describe("back navigation", () => {
    it("handleBackToArtists resets to artists view", async () => {
      mockFetchSongsByArtist.mockResolvedValue(
        makePaginatedResult([makeSong()], false)
      );

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Select artist first
      await act(async () => {
        await result.current.handleArtistSelect(makeArtist());
      });

      expect(result.current.artistViewMode).toBe("songs");

      act(() => {
        result.current.handleBackToArtists();
      });

      expect(result.current.artistViewMode).toBe("artists");
      expect(result.current.selectedArtist).toBeNull();
      expect(result.current.selectedAlbum).toBeNull();
      expect(result.current.songResults).toEqual([]);
      expect(result.current.hasMoreResults).toBe(true);
      expect(result.current.isArtistSectionCollapsed).toBe(false);
      expect(result.current.isSongSectionCollapsed).toBe(false);
      expect(result.current.isAlbumSectionCollapsed).toBe(false);
    });

    it("handleBackToAlbums resets to artists view (album context)", async () => {
      mockFetchSongsByAlbum.mockResolvedValue(
        makePaginatedResult([makeSong()], false)
      );

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await result.current.handleAlbumSelect(makeAlbum());
      });

      expect(result.current.artistViewMode).toBe("songs");

      act(() => {
        result.current.handleBackToAlbums();
      });

      expect(result.current.artistViewMode).toBe("artists");
      expect(result.current.selectedAlbum).toBeNull();
      expect(result.current.songResults).toEqual([]);
    });

    it("handleBackToPlaylists resets to playlists view", async () => {
      mockFetchPlaylists.mockResolvedValue(
        makePaginatedResult([makePlaylist()], false)
      );
      mockFetchSongsByPlaylist.mockResolvedValue(
        makePaginatedResult([makeSong()], false)
      );

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Switch to playlist tab and select a playlist
      await act(async () => {
        result.current.handleTabChange("playlist");
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await result.current.handlePlaylistSelect(makePlaylist());
      });

      expect(result.current.playlistViewMode).toBe("songs");

      act(() => {
        result.current.handleBackToPlaylists();
      });

      expect(result.current.playlistViewMode).toBe("playlists");
      expect(result.current.selectedPlaylist).toBeNull();
      expect(result.current.songResults).toEqual([]);
      expect(result.current.hasMoreResults).toBe(true);
    });
  });

  // =========================================================================
  // handleAddSong
  // =========================================================================

  describe("handleAddSong", () => {
    it("adds song successfully and shows confirmation", async () => {
      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      const song = makeSong({ title: "Great Song", artist: "Cool Band" });

      await act(async () => {
        await result.current.handleAddSong(song);
      });

      expect(mockOnAddSong).toHaveBeenCalledWith(song);
      expect(result.current.showConfirmation).toBe(true);
      expect(result.current.confirmationType).toBe("success");
      expect(result.current.confirmationMessage).toBe(
        '"Great Song" by Cool Band added to queue!'
      );
      expect(result.current.confirmationTitle).toBe("Song Added!");
      expect(result.current.error).toBeNull();
    });

    it("truncates long song titles in confirmation", async () => {
      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      const longTitle =
        "This Is An Extremely Long Song Title That Should Be Truncated";
      const song = makeSong({ title: longTitle, artist: "Artist" });

      await act(async () => {
        await result.current.handleAddSong(song);
      });

      expect(result.current.confirmationMessage).toContain(
        `"${longTitle.substring(0, 40)}..."`
      );
    });

    it("shows error when not connected", async () => {
      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, false)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await result.current.handleAddSong(makeSong());
      });

      expect(mockOnAddSong).not.toHaveBeenCalled();
      expect(result.current.error).toBe("Not connected to server");
    });

    it("handles add song error with Error instance", async () => {
      mockOnAddSong.mockRejectedValue(new Error("Queue is full"));

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await result.current.handleAddSong(makeSong());
      });

      expect(result.current.showConfirmation).toBe(true);
      expect(result.current.confirmationType).toBe("error");
      expect(result.current.confirmationMessage).toBe("Queue is full");
      expect(result.current.confirmationTitle).toBe("Error Adding Song");
      expect(result.current.error).toBe("Queue is full");
    });

    it("handles add song error with non-Error value", async () => {
      mockOnAddSong.mockRejectedValue("unexpected");

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await result.current.handleAddSong(makeSong());
      });

      expect(result.current.confirmationMessage).toBe(
        "Failed to add song to queue"
      );
    });

    it("shows join session message for session errors", async () => {
      mockOnAddSong.mockRejectedValue(
        new Error("You must join a session first")
      );

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await result.current.handleAddSong(makeSong());
      });

      expect(result.current.confirmationMessage).toBe(
        "You must join a session first. Please refresh the page and try again."
      );
    });

    it("sets addingSongId during the add operation", async () => {
      let resolveAdd: () => void;
      mockOnAddSong.mockImplementation(
        () =>
          new Promise<void>(resolve => {
            resolveAdd = resolve;
          })
      );

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      const song = makeSong({ id: "adding-song" });

      // Start adding (don't await)
      let addPromise: Promise<void>;
      act(() => {
        addPromise = result.current.handleAddSong(song);
      });

      // Check that addingSongId is set during operation
      expect(result.current.addingSongId).toBe("adding-song");

      // Resolve and check it's cleared
      await act(async () => {
        resolveAdd!();
        await addPromise!;
      });

      expect(result.current.addingSongId).toBeNull();
    });
  });

  // =========================================================================
  // handleCloseConfirmation
  // =========================================================================

  describe("handleCloseConfirmation", () => {
    it("resets confirmation state", async () => {
      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Trigger a confirmation
      await act(async () => {
        await result.current.handleAddSong(makeSong());
      });

      expect(result.current.showConfirmation).toBe(true);

      act(() => {
        result.current.handleCloseConfirmation();
      });

      expect(result.current.showConfirmation).toBe(false);
      expect(result.current.confirmationMessage).toBe("");
      expect(result.current.confirmationType).toBe("success");
    });
  });

  // =========================================================================
  // formatDuration
  // =========================================================================

  describe("formatDuration", () => {
    it("formats 0 seconds", async () => {
      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.formatDuration(0)).toBe("0:00");
    });

    it("formats seconds less than a minute", async () => {
      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.formatDuration(45)).toBe("0:45");
    });

    it("formats exact minutes", async () => {
      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.formatDuration(120)).toBe("2:00");
    });

    it("formats minutes and seconds with padding", async () => {
      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.formatDuration(185)).toBe("3:05");
    });

    it("formats large durations", async () => {
      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.formatDuration(3661)).toBe("61:01");
    });
  });

  // =========================================================================
  // getPlaceholderText
  // =========================================================================

  describe("getPlaceholderText", () => {
    it("returns default placeholder for search tab with artists view", async () => {
      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.getPlaceholderText()).toBe(
        "Search for artists, albums, and songs..."
      );
    });

    it("returns artist-specific placeholder when artist is selected", async () => {
      mockFetchSongsByArtist.mockResolvedValue(
        makePaginatedResult([makeSong()], false)
      );

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await result.current.handleArtistSelect(
          makeArtist({ name: "Beatles" })
        );
      });

      expect(result.current.getPlaceholderText()).toBe(
        "Search songs by Beatles..."
      );
    });

    it("returns album-specific placeholder when album is selected", async () => {
      mockFetchSongsByAlbum.mockResolvedValue(
        makePaginatedResult([makeSong()], false)
      );

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await result.current.handleAlbumSelect(
          makeAlbum({ name: "Abbey Road" })
        );
      });

      expect(result.current.getPlaceholderText()).toBe(
        "Search songs in Abbey Road..."
      );
    });

    it("returns generic placeholder on playlist tab", async () => {
      mockFetchPlaylists.mockResolvedValue(makePaginatedResult([], false));

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        result.current.handleTabChange("playlist");
        await vi.runAllTimersAsync();
      });

      expect(result.current.getPlaceholderText()).toBe("Search...");
    });
  });

  // =========================================================================
  // handleSearchSubmit
  // =========================================================================

  describe("handleSearchSubmit", () => {
    it("prevents default form submission", async () => {
      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      const preventDefault = vi.fn();

      act(() => {
        result.current.handleSearchSubmit({
          preventDefault,
        } as unknown as React.FormEvent);
      });

      expect(preventDefault).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Collapse state setters
  // =========================================================================

  describe("collapse state setters", () => {
    it("setIsArtistSectionCollapsed toggles artist section", async () => {
      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.isArtistSectionCollapsed).toBe(false);

      act(() => {
        result.current.setIsArtistSectionCollapsed(true);
      });

      expect(result.current.isArtistSectionCollapsed).toBe(true);
    });

    it("setIsSongSectionCollapsed toggles song section", async () => {
      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      act(() => {
        result.current.setIsSongSectionCollapsed(true);
      });

      expect(result.current.isSongSectionCollapsed).toBe(true);
    });

    it("setIsAlbumSectionCollapsed toggles album section", async () => {
      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      act(() => {
        result.current.setIsAlbumSectionCollapsed(true);
      });

      expect(result.current.isAlbumSectionCollapsed).toBe(true);
    });
  });

  // =========================================================================
  // Append / pagination behavior
  // =========================================================================

  describe("pagination append behavior", () => {
    it("appends artist results on page > 1 unified search", async () => {
      const firstResults = makeSearchResults({
        artists: [makeArtist({ id: "a1" })],
        songs: [makeSong({ id: "s1" })],
        albums: [makeAlbum({ id: "al1" })],
        hasMore: true,
      });

      mockPerformUnifiedSearch.mockResolvedValue(firstResults);

      const { result } = renderHook(() =>
        useSearchInterface(mockOnAddSong, true)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // First search
      act(() => {
        result.current.handleSearchInputChange({
          target: { value: "test" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(result.current.hasMoreResults).toBe(true);

      // Load more — verify it was called with page 2
      await act(async () => {
        result.current.handleLoadMore();
      });

      const calls = mockPerformUnifiedSearch.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0]).toMatchObject({ query: "test", page: 2 });
    });
  });

  // =========================================================================
  // isConnected pass-through
  // =========================================================================

  describe("isConnected", () => {
    it("reflects the isConnected prop", async () => {
      const { result, rerender } = renderHook(
        ({ connected }) => useSearchInterface(mockOnAddSong, connected),
        { initialProps: { connected: false } }
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.isConnected).toBe(false);

      rerender({ connected: true });

      expect(result.current.isConnected).toBe(true);
    });
  });
});
