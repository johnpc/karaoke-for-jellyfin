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

describe("JellyfinSDKService - additional coverage", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

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

  describe("getAllArtists", () => {
    it("should authenticate if userId is not set, then fetch artists", async () => {
      mockFetch
        // Authenticate (Users)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ Id: "user-1", Name: "testuser" }]),
        })
        // getMusicLibraryId
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve([
              { CollectionType: "music", ItemId: "music-lib-id" },
            ]),
        })
        // getAllArtists fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Items: [
                {
                  Id: "artist-1",
                  Name: "Artist One",
                  Type: "MusicArtist",
                  ImageTags: { Primary: "tag1" },
                },
                {
                  Id: "artist-2",
                  Name: "Artist Two",
                  Type: "MusicArtist",
                  ImageTags: {},
                },
              ],
              TotalRecordCount: 2,
            }),
        });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      const artists = await service.getAllArtists(50, 0);

      expect(artists).toHaveLength(2);
      expect(artists[0].name).toBe("Artist One");
      expect(artists[0].id).toBe("jellyfin_artist_artist-1");
      expect(artists[0].jellyfinId).toBe("artist-1");
      expect(artists[0].imageUrl).toContain("/Items/artist-1/Images/Primary");
      expect(artists[1].name).toBe("Artist Two");
      expect(artists[1].imageUrl).toBeUndefined();
    });

    it("should throw when API is not initialized", async () => {
      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      // Force api to null
      (service as unknown as { api: null }).api = null;

      await expect(service.getAllArtists()).rejects.toThrow(
        "API not initialized"
      );
    });

    it("should throw when authentication fails and userId is not set", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ Id: "user-2", Name: "wronguser" }]),
      });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();

      await expect(service.getAllArtists()).rejects.toThrow(
        "Failed to authenticate with Jellyfin"
      );
    });

    it("should throw on HTTP error from artists endpoint", async () => {
      mockFetch
        // Authenticate
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ Id: "user-1", Name: "testuser" }]),
        })
        // getMusicLibraryId
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        })
        // Artists fetch fails
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();

      await expect(service.getAllArtists()).rejects.toThrow(
        "HTTP error! status: 500"
      );
    });

    it("should handle empty artists response", async () => {
      mockFetch
        // Authenticate
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ Id: "user-1", Name: "testuser" }]),
        })
        // getMusicLibraryId
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        })
        // Artists fetch returns empty
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ Items: [], TotalRecordCount: 0 }),
        });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      const artists = await service.getAllArtists();

      expect(artists).toEqual([]);
    });

    it("should use custom limit and startIndex parameters", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ Id: "user-1", Name: "testuser" }]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ Items: [], TotalRecordCount: 0 }),
        });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      await service.getAllArtists(25, 10);

      // Verify the URL contains the correct params
      const fetchCall = mockFetch.mock.calls[2][0] as string;
      expect(fetchCall).toContain("limit=25");
      expect(fetchCall).toContain("startIndex=10");
    });
  });

  describe("getSongsByArtistId", () => {
    it("should fetch songs by artist ID and return totalCount", async () => {
      mockFetch
        // Authenticate
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ Id: "user-1", Name: "testuser" }]),
        })
        // Songs fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Items: [
                {
                  Id: "song-1",
                  Name: "Song One",
                  Type: "Audio",
                  Artists: ["Artist One"],
                  Album: "Album One",
                  RunTimeTicks: 2500000000,
                  HasLyrics: true,
                },
                {
                  Id: "song-2",
                  Name: "Song Two",
                  Type: "Audio",
                  Artists: ["Artist One"],
                  Album: "Album One",
                  RunTimeTicks: 1800000000,
                  HasLyrics: true,
                },
              ],
              TotalRecordCount: 15,
            }),
        });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      const result = await service.getSongsByArtistId("artist-1", 50, 0);

      expect(result.songs).toHaveLength(2);
      expect(result.totalCount).toBe(15);
      expect(result.songs[0].title).toBe("Song One");
      expect(result.songs[0].artist).toBe("Artist One");
      expect(result.songs[0].duration).toBe(250); // 2500000000 / 10000000
      expect(result.songs[1].title).toBe("Song Two");
    });

    it("should throw when API is not initialized", async () => {
      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      (service as unknown as { api: null }).api = null;

      await expect(service.getSongsByArtistId("artist-1")).rejects.toThrow(
        "API not initialized"
      );
    });

    it("should throw when authentication fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ Id: "user-2", Name: "wronguser" }]),
      });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();

      await expect(service.getSongsByArtistId("artist-1")).rejects.toThrow(
        "Failed to authenticate with Jellyfin"
      );
    });

    it("should throw on HTTP error", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ Id: "user-1", Name: "testuser" }]),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          statusText: "Forbidden",
        });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();

      await expect(service.getSongsByArtistId("artist-1")).rejects.toThrow(
        "HTTP 403: Forbidden"
      );
    });

    it("should handle empty items response", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ Id: "user-1", Name: "testuser" }]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ Items: [], TotalRecordCount: 0 }),
        });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      const result = await service.getSongsByArtistId("artist-1");

      expect(result.songs).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it("should filter out songs without lyrics", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ Id: "user-1", Name: "testuser" }]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Items: [
                {
                  Id: "song-1",
                  Name: "Has Lyrics",
                  Type: "Audio",
                  Artists: ["Artist"],
                  HasLyrics: true,
                },
                {
                  Id: "song-2",
                  Name: "No Lyrics",
                  Type: "Audio",
                  Artists: ["Artist"],
                  HasLyrics: false,
                },
              ],
              TotalRecordCount: 2,
            }),
        });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      const result = await service.getSongsByArtistId("artist-1");

      // Only songs with HasLyrics: true should be returned
      expect(result.songs).toHaveLength(1);
      expect(result.songs[0].title).toBe("Has Lyrics");
    });

    it("should use custom limit and startIndex", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ Id: "user-1", Name: "testuser" }]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ Items: [], TotalRecordCount: 0 }),
        });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      await service.getSongsByArtistId("artist-1", 20, 5);

      const fetchCall = mockFetch.mock.calls[1][0] as string;
      expect(fetchCall).toContain("limit=20");
      expect(fetchCall).toContain("startIndex=5");
      expect(fetchCall).toContain("artistIds=artist-1");
    });
  });

  describe("getAllAudioItems", () => {
    it("should fetch all audio items and transform them", async () => {
      mockFetch
        // Authenticate
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ Id: "user-1", Name: "testuser" }]),
        })
        // Audio items fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Items: [
                {
                  Id: "item-1",
                  Name: "Track One",
                  Type: "Audio",
                  Artists: ["Artist A"],
                  Album: "Album X",
                  RunTimeTicks: 3000000000,
                  HasLyrics: true,
                },
                {
                  Id: "item-2",
                  Name: "Track Two",
                  Type: "Audio",
                  Artists: ["Artist B", "Artist C"],
                  Album: "Album Y",
                  RunTimeTicks: 4200000000,
                  HasLyrics: true,
                },
              ],
              TotalRecordCount: 200,
            }),
        });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      const items = await service.getAllAudioItems(0, 100);

      expect(items).toHaveLength(2);
      expect(items[0].title).toBe("Track One");
      expect(items[0].artist).toBe("Artist A");
      expect(items[0].album).toBe("Album X");
      expect(items[0].duration).toBe(300); // 3000000000 / 10000000
      expect(items[0].id).toBe("jellyfin_item-1");
      expect(items[0].jellyfinId).toBe("item-1");
      expect(items[0].streamUrl).toBe("/api/stream/item-1");
      expect(items[1].artist).toBe("Artist B, Artist C");
      expect(items[1].duration).toBe(420);
    });

    it("should throw when API is not initialized", async () => {
      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      (service as unknown as { api: null }).api = null;

      await expect(service.getAllAudioItems()).rejects.toThrow(
        "API not initialized"
      );
    });

    it("should throw when authentication fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ Id: "user-2", Name: "wronguser" }]),
      });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();

      await expect(service.getAllAudioItems()).rejects.toThrow(
        "Failed to authenticate with Jellyfin"
      );
    });

    it("should throw on HTTP error", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ Id: "user-1", Name: "testuser" }]),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();

      await expect(service.getAllAudioItems()).rejects.toThrow(
        "HTTP 500: Internal Server Error"
      );
    });

    it("should handle empty items response", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ Id: "user-1", Name: "testuser" }]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ Items: [], TotalRecordCount: 0 }),
        });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      const items = await service.getAllAudioItems();

      expect(items).toEqual([]);
    });

    it("should filter out items without lyrics", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ Id: "user-1", Name: "testuser" }]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Items: [
                {
                  Id: "item-1",
                  Name: "With Lyrics",
                  Type: "Audio",
                  Artists: ["A"],
                  HasLyrics: true,
                },
                {
                  Id: "item-2",
                  Name: "Without Lyrics",
                  Type: "Audio",
                  Artists: ["B"],
                  HasLyrics: false,
                },
              ],
              TotalRecordCount: 2,
            }),
        });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      const items = await service.getAllAudioItems();

      expect(items).toHaveLength(1);
      expect(items[0].title).toBe("With Lyrics");
    });

    it("should use custom startIndex and limit parameters", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ Id: "user-1", Name: "testuser" }]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ Items: [], TotalRecordCount: 0 }),
        });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      await service.getAllAudioItems(50, 25);

      const fetchCall = mockFetch.mock.calls[1][0] as string;
      expect(fetchCall).toContain("startIndex=50");
      expect(fetchCall).toContain("limit=25");
    });
  });

  describe("getPlaylistItems", () => {
    it("should fetch playlist items and transform audio items", async () => {
      mockFetch
        // Authenticate
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ Id: "user-1", Name: "testuser" }]),
        })
        // Playlist items fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Items: [
                {
                  Id: "song-1",
                  Name: "Playlist Song One",
                  Type: "Audio",
                  Artists: ["Band A"],
                  Album: "Album 1",
                  RunTimeTicks: 2100000000,
                  HasLyrics: true,
                },
                {
                  Id: "song-2",
                  Name: "Playlist Song Two",
                  Type: "Audio",
                  Artists: ["Band B"],
                  Album: "Album 2",
                  RunTimeTicks: 3300000000,
                  HasLyrics: true,
                },
                {
                  Id: "video-1",
                  Name: "A Video",
                  Type: "Video",
                  Artists: [],
                },
              ],
              TotalRecordCount: 3,
            }),
        });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      const items = await service.getPlaylistItems("playlist-123", 50, 0);

      // Should only include Audio items, not the Video
      expect(items).toHaveLength(2);
      expect(items[0].title).toBe("Playlist Song One");
      expect(items[0].artist).toBe("Band A");
      expect(items[0].duration).toBe(210);
      expect(items[1].title).toBe("Playlist Song Two");
      expect(items[1].duration).toBe(330);
    });

    it("should throw when API is not initialized", async () => {
      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      (service as unknown as { api: null }).api = null;

      await expect(service.getPlaylistItems("playlist-1")).rejects.toThrow(
        "API not initialized"
      );
    });

    it("should throw when authentication fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ Id: "user-2", Name: "wronguser" }]),
      });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();

      await expect(service.getPlaylistItems("playlist-1")).rejects.toThrow(
        "Failed to authenticate with Jellyfin"
      );
    });

    it("should throw on HTTP error", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ Id: "user-1", Name: "testuser" }]),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: "Not Found",
        });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();

      await expect(service.getPlaylistItems("bad-id")).rejects.toThrow(
        "HTTP 404: Not Found"
      );
    });

    it("should handle empty playlist", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ Id: "user-1", Name: "testuser" }]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ Items: [], TotalRecordCount: 0 }),
        });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      const items = await service.getPlaylistItems("empty-playlist");

      expect(items).toEqual([]);
    });

    it("should filter out audio items without lyrics from playlist", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ Id: "user-1", Name: "testuser" }]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Items: [
                {
                  Id: "song-1",
                  Name: "With Lyrics",
                  Type: "Audio",
                  Artists: ["A"],
                  HasLyrics: true,
                },
                {
                  Id: "song-2",
                  Name: "Without Lyrics",
                  Type: "Audio",
                  Artists: ["B"],
                  HasLyrics: false,
                },
              ],
              TotalRecordCount: 2,
            }),
        });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      const items = await service.getPlaylistItems("playlist-1");

      expect(items).toHaveLength(1);
      expect(items[0].title).toBe("With Lyrics");
    });

    it("should use custom limit and startIndex", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ Id: "user-1", Name: "testuser" }]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ Items: [], TotalRecordCount: 0 }),
        });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      await service.getPlaylistItems("playlist-1", 30, 10);

      const fetchCall = mockFetch.mock.calls[1][0] as string;
      expect(fetchCall).toContain("limit=30");
      expect(fetchCall).toContain("startIndex=10");
      expect(fetchCall).toContain("/Playlists/playlist-1/Items");
    });

    it("should handle null Items in response", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ Id: "user-1", Name: "testuser" }]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ TotalRecordCount: 0 }),
        });

      const { JellyfinSDKService } = await import("@/services/jellyfin-sdk");
      const service = new JellyfinSDKService();
      const items = await service.getPlaylistItems("playlist-1");

      expect(items).toEqual([]);
    });
  });
});
