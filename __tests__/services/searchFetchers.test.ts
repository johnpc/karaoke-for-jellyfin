import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchPaginated,
  fetchSongsByAlbum,
  fetchSongsByArtist,
  fetchPlaylists,
  fetchSongsByPlaylist,
  fetchArtists,
} from "@/services/searchFetchers";

function mockFetchResponse(data: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

describe("searchFetchers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("fetchPaginated", () => {
    it("appends limit and startIndex to a URL without query params", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: [{ id: "1" }] })
      );

      await fetchPaginated("/api/items", 1);

      expect(fetch).toHaveBeenCalledWith("/api/items?limit=50&startIndex=0");
    });

    it("appends limit and startIndex to a URL with existing query params", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: [] })
      );

      await fetchPaginated("/api/items?q=test", 2, 25);

      expect(fetch).toHaveBeenCalledWith(
        "/api/items?q=test&limit=25&startIndex=25"
      );
    });

    it("computes startIndex correctly for page 3 with limit 20", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: [] })
      );

      await fetchPaginated("/api/data", 3, 20);

      expect(fetch).toHaveBeenCalledWith("/api/data?limit=20&startIndex=40");
    });

    it("returns data and hasMore=false when fewer items than limit", async () => {
      const items = [{ id: "a" }, { id: "b" }];
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: items })
      );

      const result = await fetchPaginated("/api/x", 1, 50);

      expect(result.data).toEqual(items);
      expect(result.hasMore).toBe(false);
    });

    it("returns hasMore=true when items length equals limit", async () => {
      const items = Array.from({ length: 50 }, (_, i) => ({ id: `${i}` }));
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: items })
      );

      const result = await fetchPaginated("/api/x", 1, 50);

      expect(result.hasMore).toBe(true);
    });

    it("returns empty data array when response data is null", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: null })
      );

      const result = await fetchPaginated("/api/x", 1);

      expect(result.data).toEqual([]);
      expect(result.hasMore).toBe(false);
    });

    it("throws an error with server message when success is false", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: false, error: { message: "Not found" } })
      );

      await expect(fetchPaginated("/api/x", 1)).rejects.toThrow("Not found");
    });

    it("throws generic error when success is false and no message", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: false })
      );

      await expect(fetchPaginated("/api/x", 1)).rejects.toThrow(
        "Request failed"
      );
    });

    it("defaults limit to 50", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: [] })
      );

      await fetchPaginated("/api/x", 1);

      expect(fetch).toHaveBeenCalledWith("/api/x?limit=50&startIndex=0");
    });

    it("propagates network errors", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        Promise.reject(new Error("Network failure"))
      );

      await expect(fetchPaginated("/api/x", 1)).rejects.toThrow(
        "Network failure"
      );
    });
  });

  describe("fetchSongsByAlbum", () => {
    it("calls correct URL for album songs", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: [{ id: "s1" }] })
      );

      const result = await fetchSongsByAlbum("album_123", 1);

      expect(fetch).toHaveBeenCalledWith(
        "/api/albums/album_123/songs?limit=50&startIndex=0"
      );
      expect(result.data).toEqual([{ id: "s1" }]);
    });

    it("paginates correctly for page 2", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: [] })
      );

      await fetchSongsByAlbum("album_123", 2);

      expect(fetch).toHaveBeenCalledWith(
        "/api/albums/album_123/songs?limit=50&startIndex=50"
      );
    });

    it("throws on failure response", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: false, error: { message: "Album gone" } })
      );

      await expect(fetchSongsByAlbum("x", 1)).rejects.toThrow("Album gone");
    });
  });

  describe("fetchSongsByArtist", () => {
    it("calls correct URL for artist songs", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: [{ id: "s2" }] })
      );

      const result = await fetchSongsByArtist("artist_456", 1);

      expect(fetch).toHaveBeenCalledWith(
        "/api/artists/artist_456/songs?limit=50&startIndex=0"
      );
      expect(result.data).toEqual([{ id: "s2" }]);
    });

    it("paginates correctly for page 3", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: [] })
      );

      await fetchSongsByArtist("artist_456", 3);

      expect(fetch).toHaveBeenCalledWith(
        "/api/artists/artist_456/songs?limit=50&startIndex=100"
      );
    });

    it("throws on failure response", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({
          success: false,
          error: { message: "Artist not found" },
        })
      );

      await expect(fetchSongsByArtist("x", 1)).rejects.toThrow(
        "Artist not found"
      );
    });
  });

  describe("fetchPlaylists", () => {
    it("calls correct URL for playlists", async () => {
      const playlists = [{ id: "p1", name: "Party" }];
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: playlists })
      );

      const result = await fetchPlaylists(1);

      expect(fetch).toHaveBeenCalledWith(
        "/api/playlists?limit=50&startIndex=0"
      );
      expect(result.data).toEqual(playlists);
    });

    it("paginates correctly for page 4", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: [] })
      );

      await fetchPlaylists(4);

      expect(fetch).toHaveBeenCalledWith(
        "/api/playlists?limit=50&startIndex=150"
      );
    });

    it("returns hasMore=true when playlist count equals limit", async () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        id: `p_${i}`,
        name: `Playlist ${i}`,
      }));
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: items })
      );

      const result = await fetchPlaylists(1);

      expect(result.hasMore).toBe(true);
    });

    it("throws on failure response", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: false, error: { message: "Forbidden" } })
      );

      await expect(fetchPlaylists(1)).rejects.toThrow("Forbidden");
    });
  });

  describe("fetchSongsByPlaylist", () => {
    it("calls correct URL for playlist items", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: [{ id: "s3" }] })
      );

      const result = await fetchSongsByPlaylist("playlist_789", 1);

      expect(fetch).toHaveBeenCalledWith(
        "/api/playlists/playlist_789/items?limit=50&startIndex=0"
      );
      expect(result.data).toEqual([{ id: "s3" }]);
    });

    it("paginates correctly for page 5", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: [] })
      );

      await fetchSongsByPlaylist("playlist_789", 5);

      expect(fetch).toHaveBeenCalledWith(
        "/api/playlists/playlist_789/items?limit=50&startIndex=200"
      );
    });

    it("throws on failure response", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({
          success: false,
          error: { message: "Playlist empty" },
        })
      );

      await expect(fetchSongsByPlaylist("x", 1)).rejects.toThrow(
        "Playlist empty"
      );
    });
  });

  describe("fetchArtists", () => {
    it("calls correct URL for artists", async () => {
      const artists = [{ id: "a1", name: "Artist One" }];
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: artists })
      );

      const result = await fetchArtists(1);

      expect(fetch).toHaveBeenCalledWith("/api/artists?limit=50&startIndex=0");
      expect(result.data).toEqual(artists);
    });

    it("paginates correctly for page 2", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: [] })
      );

      await fetchArtists(2);

      expect(fetch).toHaveBeenCalledWith("/api/artists?limit=50&startIndex=50");
    });

    it("returns hasMore=true when artist count equals limit", async () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        id: `a_${i}`,
        name: `Artist ${i}`,
      }));
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: items })
      );

      const result = await fetchArtists(1);

      expect(result.hasMore).toBe(true);
    });

    it("returns hasMore=false when fewer artists than limit", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: [{ id: "a1" }] })
      );

      const result = await fetchArtists(1);

      expect(result.hasMore).toBe(false);
    });

    it("throws on failure response", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: false, error: { message: "Timeout" } })
      );

      await expect(fetchArtists(1)).rejects.toThrow("Timeout");
    });

    it("propagates network errors", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        Promise.reject(new Error("Connection refused"))
      );

      await expect(fetchArtists(1)).rejects.toThrow("Connection refused");
    });
  });
});
