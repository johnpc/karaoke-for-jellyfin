import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  performUnifiedSearch,
  loadMoreArtists,
  getSongsByArtist,
  getSongsByAlbum,
  getPlaylists,
  getSongsByPlaylist,
  mergeUniqueResults,
} from "@/services/searchService";
import { Artist, Album, Playlist, MediaItem } from "@/types";

function mockFetchResponse(data: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

describe("searchService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("performUnifiedSearch", () => {
    it("returns empty results for empty query", async () => {
      const result = await performUnifiedSearch({ query: "" });

      expect(result).toEqual({
        artists: [],
        albums: [],
        songs: [],
        hasMore: false,
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it("returns empty results for whitespace-only query", async () => {
      const result = await performUnifiedSearch({ query: "   " });

      expect(result).toEqual({
        artists: [],
        albums: [],
        songs: [],
        hasMore: false,
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it("fetches artists, albums, and songs in parallel", async () => {
      const mockArtists = [{ id: "a1", name: "Artist 1" }];
      const mockAlbums = [{ id: "al1", name: "Album 1" }];
      const mockSongs = [{ id: "s1", title: "Song 1" }];

      vi.mocked(fetch)
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, data: mockArtists })
        )
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, data: mockAlbums })
        )
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, data: mockSongs })
        );

      const result = await performUnifiedSearch({ query: "test" });

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(fetch).toHaveBeenCalledWith(
        "/api/artists?q=test&limit=50&startIndex=0"
      );
      expect(fetch).toHaveBeenCalledWith(
        "/api/albums?q=test&limit=50&startIndex=0"
      );
      expect(fetch).toHaveBeenCalledWith(
        "/api/songs/title?q=test&limit=50&startIndex=0"
      );
      expect(result.artists).toEqual(mockArtists);
      expect(result.albums).toEqual(mockAlbums);
      expect(result.songs).toEqual(mockSongs);
    });

    it("uses pagination parameters correctly", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: [] })
      );

      await performUnifiedSearch({ query: "test", page: 3, limit: 20 });

      expect(fetch).toHaveBeenCalledWith(
        "/api/artists?q=test&limit=20&startIndex=40"
      );
      expect(fetch).toHaveBeenCalledWith(
        "/api/albums?q=test&limit=20&startIndex=40"
      );
      expect(fetch).toHaveBeenCalledWith(
        "/api/songs/title?q=test&limit=20&startIndex=40"
      );
    });

    it("encodes query parameter", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: [] })
      );

      await performUnifiedSearch({ query: "hello world" });

      expect(fetch).toHaveBeenCalledWith(
        "/api/artists?q=hello%20world&limit=50&startIndex=0"
      );
    });

    it("sets hasMore true when any result set is full", async () => {
      const fullResults = Array.from({ length: 50 }, (_, i) => ({
        id: `item_${i}`,
      }));

      vi.mocked(fetch)
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, data: fullResults })
        )
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, data: [] })
        )
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, data: [] })
        );

      const result = await performUnifiedSearch({ query: "test" });

      expect(result.hasMore).toBe(true);
    });

    it("sets hasMore false when all results are less than limit", async () => {
      vi.mocked(fetch)
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, data: [{ id: "1" }] })
        )
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, data: [{ id: "2" }] })
        )
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, data: [{ id: "3" }] })
        );

      const result = await performUnifiedSearch({ query: "test" });

      expect(result.hasMore).toBe(false);
    });

    it("handles partial failure - only artists fail", async () => {
      vi.mocked(fetch)
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: false, error: "Artist API error" })
        )
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, data: [{ id: "al1" }] })
        )
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, data: [{ id: "s1" }] })
        );

      const result = await performUnifiedSearch({ query: "test" });

      expect(result.artists).toEqual([]);
      expect(result.albums).toEqual([{ id: "al1" }]);
      expect(result.songs).toEqual([{ id: "s1" }]);
      expect(result.error).toBe("Failed to search artists");
    });

    it("handles partial failure - artists and albums fail", async () => {
      vi.mocked(fetch)
        .mockImplementationOnce(() => mockFetchResponse({ success: false }))
        .mockImplementationOnce(() => mockFetchResponse({ success: false }))
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, data: [{ id: "s1" }] })
        );

      const result = await performUnifiedSearch({ query: "test" });

      expect(result.error).toBe("Failed to search artists and albums");
    });

    it("handles partial failure - artists and songs fail", async () => {
      vi.mocked(fetch)
        .mockImplementationOnce(() => mockFetchResponse({ success: false }))
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, data: [] })
        )
        .mockImplementationOnce(() => mockFetchResponse({ success: false }));

      const result = await performUnifiedSearch({ query: "test" });

      expect(result.error).toBe("Failed to search artists and songs");
    });

    it("handles partial failure - albums and songs fail", async () => {
      vi.mocked(fetch)
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, data: [] })
        )
        .mockImplementationOnce(() => mockFetchResponse({ success: false }))
        .mockImplementationOnce(() => mockFetchResponse({ success: false }));

      const result = await performUnifiedSearch({ query: "test" });

      expect(result.error).toBe("Failed to search albums and songs");
    });

    it("handles partial failure - only albums fail", async () => {
      vi.mocked(fetch)
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, data: [] })
        )
        .mockImplementationOnce(() => mockFetchResponse({ success: false }))
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, data: [] })
        );

      const result = await performUnifiedSearch({ query: "test" });

      expect(result.error).toBe("Failed to search albums");
    });

    it("handles partial failure - only songs fail", async () => {
      vi.mocked(fetch)
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, data: [] })
        )
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, data: [] })
        )
        .mockImplementationOnce(() => mockFetchResponse({ success: false }));

      const result = await performUnifiedSearch({ query: "test" });

      expect(result.error).toBe("Failed to search songs");
    });

    it("handles all searches failing", async () => {
      vi.mocked(fetch)
        .mockImplementationOnce(() => mockFetchResponse({ success: false }))
        .mockImplementationOnce(() => mockFetchResponse({ success: false }))
        .mockImplementationOnce(() => mockFetchResponse({ success: false }));

      const result = await performUnifiedSearch({ query: "test" });

      expect(result.error).toBe("Failed to search artists, albums, and songs");
      expect(result.artists).toEqual([]);
      expect(result.albums).toEqual([]);
      expect(result.songs).toEqual([]);
    });

    it("handles no error when all succeed", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: [] })
      );

      const result = await performUnifiedSearch({ query: "test" });

      expect(result.error).toBeUndefined();
    });

    it("handles network error", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        Promise.reject(new Error("Network error"))
      );

      const result = await performUnifiedSearch({ query: "test" });

      expect(result).toEqual({
        artists: [],
        albums: [],
        songs: [],
        hasMore: false,
        error: "Failed to connect to server",
      });
    });

    it("handles null data in response", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: null })
      );

      const result = await performUnifiedSearch({ query: "test" });

      expect(result.artists).toEqual([]);
      expect(result.albums).toEqual([]);
      expect(result.songs).toEqual([]);
    });

    it("defaults to page 1 and limit 50", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: [] })
      );

      await performUnifiedSearch({ query: "test" });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=50&startIndex=0")
      );
    });
  });

  describe("loadMoreArtists", () => {
    it("fetches artists without query parameter", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({
          success: true,
          data: [{ id: "a1", name: "Artist" }],
        })
      );

      const result = await loadMoreArtists({ query: "", page: 1 });

      expect(fetch).toHaveBeenCalledWith("/api/artists?limit=50&startIndex=0");
      expect(result.data).toEqual([{ id: "a1", name: "Artist" }]);
      expect(result.hasMore).toBe(false);
    });

    it("calculates startIndex from page and limit", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: [] })
      );

      await loadMoreArtists({ query: "", page: 3, limit: 25 });

      expect(fetch).toHaveBeenCalledWith("/api/artists?limit=25&startIndex=50");
    });

    it("sets hasMore true when result count equals limit", async () => {
      const fullResults = Array.from({ length: 50 }, (_, i) => ({
        id: `a_${i}`,
        name: `Artist ${i}`,
      }));

      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: fullResults })
      );

      const result = await loadMoreArtists({ query: "" });

      expect(result.hasMore).toBe(true);
    });

    it("handles API failure response", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: false, error: "Server error" })
      );

      const result = await loadMoreArtists({ query: "" });

      expect(result.data).toEqual([]);
      expect(result.hasMore).toBe(false);
      expect(result.error).toBe("Server error");
    });

    it("uses default error message when no error provided", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: false })
      );

      const result = await loadMoreArtists({ query: "" });

      expect(result.error).toBe("Failed to load artists");
    });

    it("handles network error", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        Promise.reject(new Error("Network failure"))
      );

      const result = await loadMoreArtists({ query: "" });

      expect(result.data).toEqual([]);
      expect(result.hasMore).toBe(false);
      expect(result.error).toBe("Failed to connect to server");
    });
  });

  describe("getSongsByArtist", () => {
    const mockArtist: Artist = {
      id: "artist_1",
      name: "Test Artist",
      jellyfinId: "jf_artist_1",
    };

    it("fetches songs for an artist", async () => {
      const mockSongs = [{ id: "s1", title: "Song 1" }];
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: mockSongs })
      );

      const result = await getSongsByArtist(mockArtist, { query: "" });

      expect(fetch).toHaveBeenCalledWith(
        "/api/artists/artist_1/songs?limit=50&startIndex=0"
      );
      expect(result.data).toEqual(mockSongs);
    });

    it("uses pagination parameters", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: [] })
      );

      await getSongsByArtist(mockArtist, { query: "", page: 2, limit: 10 });

      expect(fetch).toHaveBeenCalledWith(
        "/api/artists/artist_1/songs?limit=10&startIndex=10"
      );
    });

    it("sets hasMore when results equal limit", async () => {
      const fullResults = Array.from({ length: 50 }, (_, i) => ({
        id: `s_${i}`,
      }));
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: fullResults })
      );

      const result = await getSongsByArtist(mockArtist, { query: "" });

      expect(result.hasMore).toBe(true);
    });

    it("handles API failure response", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: false, error: "Not found" })
      );

      const result = await getSongsByArtist(mockArtist, { query: "" });

      expect(result.data).toEqual([]);
      expect(result.hasMore).toBe(false);
      expect(result.error).toBe("Not found");
    });

    it("uses default error message when no error provided", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: false })
      );

      const result = await getSongsByArtist(mockArtist, { query: "" });

      expect(result.error).toBe("Failed to load artist songs");
    });

    it("handles network error", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        Promise.reject(new Error("Connection refused"))
      );

      const result = await getSongsByArtist(mockArtist, { query: "" });

      expect(result.data).toEqual([]);
      expect(result.hasMore).toBe(false);
      expect(result.error).toBe("Failed to connect to server");
    });
  });

  describe("getSongsByAlbum", () => {
    const mockAlbum: Album = {
      id: "album_1",
      name: "Test Album",
      artist: "Test Artist",
      jellyfinId: "jf_album_1",
    };

    it("fetches songs for an album", async () => {
      const mockSongs = [{ id: "s1", title: "Track 1" }];
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: mockSongs })
      );

      const result = await getSongsByAlbum(mockAlbum, { query: "" });

      expect(fetch).toHaveBeenCalledWith(
        "/api/albums/album_1/songs?limit=50&startIndex=0"
      );
      expect(result.data).toEqual(mockSongs);
    });

    it("uses pagination parameters", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: [] })
      );

      await getSongsByAlbum(mockAlbum, { query: "", page: 4, limit: 15 });

      expect(fetch).toHaveBeenCalledWith(
        "/api/albums/album_1/songs?limit=15&startIndex=45"
      );
    });

    it("sets hasMore when results equal limit", async () => {
      const fullResults = Array.from({ length: 50 }, (_, i) => ({
        id: `s_${i}`,
      }));
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: fullResults })
      );

      const result = await getSongsByAlbum(mockAlbum, { query: "" });

      expect(result.hasMore).toBe(true);
    });

    it("handles API failure response", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: false, error: "Album not found" })
      );

      const result = await getSongsByAlbum(mockAlbum, { query: "" });

      expect(result.data).toEqual([]);
      expect(result.error).toBe("Album not found");
    });

    it("uses default error message when no error provided", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: false })
      );

      const result = await getSongsByAlbum(mockAlbum, { query: "" });

      expect(result.error).toBe("Failed to load album songs");
    });

    it("handles network error", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        Promise.reject(new Error("Timeout"))
      );

      const result = await getSongsByAlbum(mockAlbum, { query: "" });

      expect(result.data).toEqual([]);
      expect(result.hasMore).toBe(false);
      expect(result.error).toBe("Failed to connect to server");
    });
  });

  describe("getPlaylists", () => {
    it("fetches playlists", async () => {
      const mockPlaylists = [{ id: "p1", name: "Party Mix" }];
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: mockPlaylists })
      );

      const result = await getPlaylists({ query: "" });

      expect(fetch).toHaveBeenCalledWith(
        "/api/playlists?limit=50&startIndex=0"
      );
      expect(result.data).toEqual(mockPlaylists);
    });

    it("uses pagination parameters", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: [] })
      );

      await getPlaylists({ query: "", page: 2, limit: 30 });

      expect(fetch).toHaveBeenCalledWith(
        "/api/playlists?limit=30&startIndex=30"
      );
    });

    it("sets hasMore when results equal limit", async () => {
      const fullResults = Array.from({ length: 50 }, (_, i) => ({
        id: `p_${i}`,
      }));
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: fullResults })
      );

      const result = await getPlaylists({ query: "" });

      expect(result.hasMore).toBe(true);
    });

    it("handles API failure response", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: false, error: "Unauthorized" })
      );

      const result = await getPlaylists({ query: "" });

      expect(result.data).toEqual([]);
      expect(result.error).toBe("Unauthorized");
    });

    it("uses default error message when no error provided", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: false })
      );

      const result = await getPlaylists({ query: "" });

      expect(result.error).toBe("Failed to load playlists");
    });

    it("handles network error", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        Promise.reject(new Error("DNS resolution failed"))
      );

      const result = await getPlaylists({ query: "" });

      expect(result.data).toEqual([]);
      expect(result.hasMore).toBe(false);
      expect(result.error).toBe("Failed to connect to server");
    });
  });

  describe("getSongsByPlaylist", () => {
    const mockPlaylist: Playlist = {
      id: "playlist_1",
      name: "Party Mix",
      jellyfinId: "jf_playlist_1",
    };

    it("fetches songs for a playlist", async () => {
      const mockSongs = [{ id: "s1", title: "Party Song" }];
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: mockSongs })
      );

      const result = await getSongsByPlaylist(mockPlaylist, { query: "" });

      expect(fetch).toHaveBeenCalledWith(
        "/api/playlists/playlist_1/songs?limit=50&startIndex=0"
      );
      expect(result.data).toEqual(mockSongs);
    });

    it("uses pagination parameters", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: [] })
      );

      await getSongsByPlaylist(mockPlaylist, { query: "", page: 5, limit: 20 });

      expect(fetch).toHaveBeenCalledWith(
        "/api/playlists/playlist_1/songs?limit=20&startIndex=80"
      );
    });

    it("sets hasMore when results equal limit", async () => {
      const fullResults = Array.from({ length: 50 }, (_, i) => ({
        id: `s_${i}`,
      }));
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: fullResults })
      );

      const result = await getSongsByPlaylist(mockPlaylist, { query: "" });

      expect(result.hasMore).toBe(true);
    });

    it("handles API failure response", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: false, error: "Playlist empty" })
      );

      const result = await getSongsByPlaylist(mockPlaylist, { query: "" });

      expect(result.data).toEqual([]);
      expect(result.error).toBe("Playlist empty");
    });

    it("uses default error message when no error provided", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: false })
      );

      const result = await getSongsByPlaylist(mockPlaylist, { query: "" });

      expect(result.error).toBe("Failed to load playlist songs");
    });

    it("handles network error", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        Promise.reject(new Error("Server down"))
      );

      const result = await getSongsByPlaylist(mockPlaylist, { query: "" });

      expect(result.data).toEqual([]);
      expect(result.hasMore).toBe(false);
      expect(result.error).toBe("Failed to connect to server");
    });
  });

  describe("mergeUniqueResults", () => {
    it("merges two arrays without duplicates", () => {
      const existing = [
        { id: "1", name: "First" },
        { id: "2", name: "Second" },
      ];
      const newResults = [
        { id: "3", name: "Third" },
        { id: "4", name: "Fourth" },
      ];

      const result = mergeUniqueResults(existing, newResults);

      expect(result).toHaveLength(4);
      expect(result.map(r => r.id)).toEqual(["1", "2", "3", "4"]);
    });

    it("removes duplicates based on id", () => {
      const existing = [
        { id: "1", name: "First" },
        { id: "2", name: "Second" },
      ];
      const newResults = [
        { id: "2", name: "Second Duplicate" },
        { id: "3", name: "Third" },
      ];

      const result = mergeUniqueResults(existing, newResults);

      expect(result).toHaveLength(3);
      expect(result.map(r => r.id)).toEqual(["1", "2", "3"]);
    });

    it("keeps the first occurrence when duplicates exist", () => {
      const existing = [{ id: "1", name: "Original" }];
      const newResults = [{ id: "1", name: "Duplicate" }];

      const result = mergeUniqueResults(existing, newResults);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Original");
    });

    it("handles empty existing array", () => {
      const existing: { id: string; name: string }[] = [];
      const newResults = [
        { id: "1", name: "First" },
        { id: "2", name: "Second" },
      ];

      const result = mergeUniqueResults(existing, newResults);

      expect(result).toHaveLength(2);
    });

    it("handles empty new results array", () => {
      const existing = [
        { id: "1", name: "First" },
        { id: "2", name: "Second" },
      ];
      const newResults: { id: string; name: string }[] = [];

      const result = mergeUniqueResults(existing, newResults);

      expect(result).toHaveLength(2);
    });

    it("handles both arrays empty", () => {
      const result = mergeUniqueResults(
        [] as { id: string }[],
        [] as { id: string }[]
      );

      expect(result).toHaveLength(0);
    });

    it("handles all duplicates", () => {
      const existing = [
        { id: "1", name: "A" },
        { id: "2", name: "B" },
      ];
      const newResults = [
        { id: "1", name: "A copy" },
        { id: "2", name: "B copy" },
      ];

      const result = mergeUniqueResults(existing, newResults);

      expect(result).toHaveLength(2);
    });

    it("handles duplicates within new results array", () => {
      const existing = [{ id: "1", name: "Existing" }];
      const newResults = [
        { id: "2", name: "New First" },
        { id: "2", name: "New Duplicate" },
      ];

      const result = mergeUniqueResults(existing, newResults);

      expect(result).toHaveLength(2);
      expect(result[1].name).toBe("New First");
    });
  });
});
