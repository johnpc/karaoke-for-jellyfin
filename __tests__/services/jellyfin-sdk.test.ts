import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the @jellyfin/sdk module
const mockCreateApi = vi.fn().mockReturnValue({});

vi.mock("@jellyfin/sdk", () => {
  class MockJellyfin {
    createApi = mockCreateApi;
  }
  return {
    Jellyfin: MockJellyfin,
    Api: class MockApi {},
  };
});

// Mock global fetch
const mockFetch = vi.fn();

describe("JellyfinSDKService", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    // Set required environment variables
    process.env = {
      ...originalEnv,
      JELLYFIN_SERVER_URL: "http://jellyfin.local:8096",
      JELLYFIN_API_KEY: "test-api-key-123",
      JELLYFIN_USERNAME: "testuser",
    };

    global.fetch = mockFetch;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should throw if environment variables are missing", async () => {
    process.env.JELLYFIN_SERVER_URL = "";
    process.env.JELLYFIN_API_KEY = "";
    process.env.JELLYFIN_USERNAME = "";

    const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
    expect(() => new JellyfinSDKService()).toThrow(
      "JELLYFIN_SERVER_URL, JELLYFIN_API_KEY, and JELLYFIN_USERNAME must be configured"
    );
  });

  it("should construct successfully with valid env vars", async () => {
    const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
    const service = new JellyfinSDKService();
    expect(service).toBeDefined();
    expect(mockCreateApi).toHaveBeenCalledWith(
      "http://jellyfin.local:8096",
      "test-api-key-123"
    );
  });

  it("should strip trailing slash from baseUrl", async () => {
    process.env.JELLYFIN_SERVER_URL = "http://jellyfin.local:8096/";
    const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
    new JellyfinSDKService();
    expect(mockCreateApi).toHaveBeenCalledWith(
      "http://jellyfin.local:8096",
      "test-api-key-123"
    );
  });

  describe("authenticate", () => {
    it("should authenticate successfully and find user", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            { Id: "user-id-1", Name: "testuser" },
            { Id: "user-id-2", Name: "otheruser" },
          ]),
      });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      const result = await service.authenticate();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://jellyfin.local:8096/Users",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "X-Emby-Token": "test-api-key-123",
          }),
        })
      );
    });

    it("should return false if user is not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ Id: "user-id-2", Name: "otheruser" }]),
      });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      const result = await service.authenticate();

      expect(result).toBe(false);
    });

    it("should return false on HTTP error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      const result = await service.authenticate();

      expect(result).toBe(false);
    });

    it("should return false on network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      const result = await service.authenticate();

      expect(result).toBe(false);
    });
  });

  describe("searchArtists", () => {
    it("should search for artists and transform results", async () => {
      // First call for authenticate (Users)
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ Id: "user-1", Name: "testuser" }]),
        })
        // Second call for getMusicLibraryId
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve([
              { CollectionType: "music", ItemId: "music-lib-id" },
            ]),
        })
        // Third call for actual artist search
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Items: [
                {
                  Id: "artist-1",
                  Name: "Queen",
                  Type: "MusicArtist",
                  ImageTags: { Primary: "tag1" },
                },
                {
                  Id: "artist-2",
                  Name: "Queens of the Stone Age",
                  Type: "MusicArtist",
                  ImageTags: {},
                },
              ],
              TotalRecordCount: 2,
            }),
        });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      const artists = await service.searchArtists("Queen");

      expect(artists).toHaveLength(2);
      expect(artists[0].name).toBe("Queen");
      expect(artists[0].id).toBe("jellyfin_artist_artist-1");
      expect(artists[0].jellyfinId).toBe("artist-1");
      expect(artists[0].imageUrl).toContain("/Items/artist-1/Images/Primary");
      expect(artists[1].imageUrl).toBeUndefined();
    });
  });

  describe("searchByTitle", () => {
    it("should search by title and filter results", async () => {
      // Authenticate
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ Id: "user-1", Name: "testuser" }]),
        })
        // Search items
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Items: [
                {
                  Id: "song-1",
                  Name: "Bohemian Rhapsody",
                  Type: "Audio",
                  Artists: ["Queen"],
                  Album: "A Night at the Opera",
                  RunTimeTicks: 3540000000,
                  HasLyrics: true,
                },
                {
                  Id: "song-2",
                  Name: "Another Song",
                  Type: "Audio",
                  Artists: ["Other"],
                  Album: "Album",
                  RunTimeTicks: 2000000000,
                  HasLyrics: true,
                },
              ],
              TotalRecordCount: 2,
            }),
        });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      const results = await service.searchByTitle("Bohemian");

      // Only "Bohemian Rhapsody" matches the title filter
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("Bohemian Rhapsody");
      expect(results[0].artist).toBe("Queen");
      expect(results[0].duration).toBe(354); // 3540000000 / 10000000
    });
  });

  describe("getStreamUrl", () => {
    it("should return proxy stream URL", async () => {
      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      const url = service.getStreamUrl("item-123");

      expect(url).toBe("/api/stream/item-123");
    });
  });

  describe("getDirectStreamUrl", () => {
    it("should return direct stream URL with auth params", async () => {
      // Authenticate first
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ Id: "user-1", Name: "testuser" }]),
      });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      const url = await service.getDirectStreamUrl("item-123");

      expect(url).toContain(
        "http://jellyfin.local:8096/Audio/item-123/universal"
      );
      expect(url).toContain("userId=user-1");
      expect(url).toContain("api_key=test-api-key-123");
    });
  });

  describe("healthCheck", () => {
    it("should return true when server is accessible", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      const result = await service.healthCheck();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://jellyfin.local:8096/System/Info",
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Emby-Token": "test-api-key-123",
          }),
        })
      );
    });

    it("should return false when server is not accessible", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      const result = await service.healthCheck();

      expect(result).toBe(false);
    });

    it("should return false on network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      const result = await service.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe("getPlaylists", () => {
    it("should fetch and transform playlists", async () => {
      // Authenticate
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ Id: "user-1", Name: "testuser" }]),
        })
        // Get playlists
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Items: [
                {
                  Id: "pl-1",
                  Name: "My Playlist",
                  Type: "Playlist",
                  ChildCount: 25,
                  Overview: "A great playlist",
                  ImageTags: { Primary: "tag" },
                  DateCreated: "2024-01-01T00:00:00Z",
                },
              ],
              TotalRecordCount: 1,
            }),
        });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      const playlists = await service.getPlaylists();

      expect(playlists).toHaveLength(1);
      expect(playlists[0].name).toBe("My Playlist");
      expect(playlists[0].id).toBe("jellyfin_playlist_pl-1");
      expect(playlists[0].trackCount).toBe(25);
      expect(playlists[0].description).toBe("A great playlist");
    });
  });

  describe("getJellyfinSDKService (singleton)", () => {
    it("should return a service instance", async () => {
      const { getJellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = getJellyfinSDKService();
      expect(service).toBeDefined();
    });
  });
});
