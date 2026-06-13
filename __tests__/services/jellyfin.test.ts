// Unit tests for Jellyfin service
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  MockedFunction,
} from "vitest";
import { JellyfinService } from "@/services/jellyfin";

// Mock fetch globally
global.fetch = vi.fn();

describe("JellyfinService", () => {
  let service: JellyfinService;
  const mockFetch = fetch as MockedFunction<typeof fetch>;

  beforeEach(() => {
    // Set up environment variables
    process.env.JELLYFIN_SERVER_URL = "https://test.jellyfin.com";
    process.env.JELLYFIN_API_KEY = "test-api-key";
    process.env.JELLYFIN_USERNAME = "test-user";

    service = new JellyfinService();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with environment variables", () => {
      expect(service).toBeInstanceOf(JellyfinService);
    });

    it("should throw error if environment variables are missing", () => {
      delete process.env.JELLYFIN_SERVER_URL;
      delete process.env.JELLYFIN_API_KEY;
      delete process.env.JELLYFIN_USERNAME;

      expect(() => new JellyfinService()).toThrow(
        "JELLYFIN_SERVER_URL, JELLYFIN_API_KEY, and JELLYFIN_USERNAME must be configured"
      );
    });
  });

  describe("authenticate", () => {
    it("should authenticate successfully", async () => {
      const mockUsers = [{ Id: "user123", Name: "test-user" }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers,
      } as Response);

      const result = await service.authenticate();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.jellyfin.com/Users",
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Emby-Token": "test-api-key",
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should handle authentication failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      const result = await service.authenticate();

      expect(result).toBe(false);
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await service.authenticate();

      expect(result).toBe(false);
    });
  });

  describe("searchMedia", () => {
    beforeEach(async () => {
      // Mock successful authentication
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ Id: "user123", Name: "test-user" }],
      } as Response);

      await service.authenticate();
      mockFetch.mockClear();
    });

    it("should search for media successfully", async () => {
      const mockSearchResponse = {
        Items: [
          {
            Id: "song123",
            Name: "Test Song",
            Artists: ["Test Artist"],
            Album: "Test Album",
            RunTimeTicks: 1800000000, // 3 minutes in ticks
            Type: "Audio",
          },
        ],
        TotalRecordCount: 1,
      };

      // Mock both search calls (title and artist search)
      // First call should return the song (title search matches "test query")
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSearchResponse,
        } as Response)
        // Second call returns empty (artist search doesn't match "test query")
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ Items: [], TotalRecordCount: 0 }),
        } as Response);

      const result = await service.searchMedia("test");

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "jellyfin_song123",
        title: "Test Song",
        artist: "Test Artist",
        album: "Test Album",
        duration: 180,
        jellyfinId: "song123",
        streamUrl: "/api/stream/song123",
        lyricsPath: "jellyfin_song123",
      });

      // Should make two search calls (title and artist)
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should deduplicate results from title and artist searches", async () => {
      const mockSong = {
        Id: "song123",
        Name: "Test Song",
        Artists: ["Test Artist"],
        Album: "Test Album",
        RunTimeTicks: 1800000000,
        Type: "Audio",
      };

      const mockSearchResponse = {
        Items: [mockSong],
        TotalRecordCount: 1,
      };

      // Mock both searches returning the same song
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSearchResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSearchResponse,
        } as Response);

      const result = await service.searchMedia("test");

      // Should only return one result despite both searches finding the same song
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("jellyfin_song123");
    });

    it("should sort results by relevance", async () => {
      const mockSongs = [
        {
          Id: "song1",
          Name: "Test Song",
          Artists: ["Artist B"],
          Album: "Album",
          RunTimeTicks: 1800000000,
          Type: "Audio",
        },
        {
          Id: "song2",
          Name: "Another Song",
          Artists: ["Test Artist"], // Exact artist match
          Album: "Album",
          RunTimeTicks: 1800000000,
          Type: "Audio",
        },
        {
          Id: "song3",
          Name: "Test", // Exact title match
          Artists: ["Artist C"],
          Album: "Album",
          RunTimeTicks: 1800000000,
          Type: "Audio",
        },
      ];

      // Mock title search returning songs 1 and 3 (both have "test" in title)
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            Items: [mockSongs[0], mockSongs[2]],
            TotalRecordCount: 2,
          }),
        } as Response)
        // Mock artist search returning song 2 (has "test" in artist name)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ Items: [mockSongs[1]], TotalRecordCount: 1 }),
        } as Response);

      const result = await service.searchMedia("test");

      expect(result).toHaveLength(3);
      // Should be sorted: exact title match first, then exact artist match, then partial title match
      expect(result[0].title).toBe("Test"); // Exact title match
      expect(result[1].title).toBe("Test Song"); // Partial title match (alphabetically before "Another Song")
      expect(result[2].artist).toBe("Test Artist"); // Exact artist match
    });

    it("should handle search errors gracefully", async () => {
      // Mock first search failing, second succeeding
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ Items: [], TotalRecordCount: 0 }),
        } as Response);

      // Should not throw error, just return empty results
      const result = await service.searchMedia("test");
      expect(result).toEqual([]);
    });

    it("should handle complete search failure", async () => {
      // Mock both searches failing
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as Response);

      // Should not throw error, just return empty results
      const result = await service.searchMedia("test");
      expect(result).toEqual([]);
    });

    it("should respect the limit parameter", async () => {
      const mockSongs = Array.from({ length: 10 }, (_, i) => ({
        Id: `song${i}`,
        Name: `Test Song ${i}`,
        Artists: [`Artist ${i}`],
        Album: "Album",
        RunTimeTicks: 1800000000,
        Type: "Audio",
      }));

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            Items: mockSongs.slice(0, 5),
            TotalRecordCount: 5,
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            Items: mockSongs.slice(5),
            TotalRecordCount: 5,
          }),
        } as Response);

      const result = await service.searchMedia("test", 3);

      // Should limit results to 3 even though we got 10 total
      expect(result).toHaveLength(3);
    });
  });

  describe("getStreamUrl", () => {
    it("should generate correct stream URL", () => {
      const url = service.getStreamUrl("song123");

      expect(url).toBe("/api/stream/song123");
    });
  });

  describe("healthCheck", () => {
    it("should return true for healthy server", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response);

      const result = await service.healthCheck();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.jellyfin.com/System/Info",
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Emby-Token": "test-api-key",
          }),
        })
      );
    });

    it("should return false for unhealthy server", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      } as Response);

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe("getMediaMetadata", () => {
    beforeEach(async () => {
      // Mock successful authentication
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ Id: "user123", Name: "test-user" }],
      } as Response);

      await service.authenticate();
      mockFetch.mockClear();
    });

    it("should get media metadata successfully", async () => {
      const mockItem = {
        Id: "song123",
        Name: "Test Song",
        Artists: ["Test Artist"],
        Album: "Test Album",
        RunTimeTicks: 1800000000,
        Type: "Audio",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockItem,
      } as Response);

      const result = await service.getMediaMetadata("song123");

      expect(result).toMatchObject({
        id: "jellyfin_song123",
        title: "Test Song",
        artist: "Test Artist",
        album: "Test Album",
        duration: 180,
        jellyfinId: "song123",
        streamUrl: "/api/stream/song123",
        lyricsPath: "jellyfin_song123",
      });
    });

    it("should return null for failed requests", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const result = await service.getMediaMetadata("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("searchByTitle", () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ Id: "user123", Name: "test-user" }],
      } as Response);

      await service.authenticate();
      mockFetch.mockClear();
    });

    it("should search by title and return results", async () => {
      const mockResponse = {
        Items: [
          {
            Id: "song1",
            Name: "Bohemian Rhapsody",
            Artists: ["Queen"],
            Album: "A Night at the Opera",
            RunTimeTicks: 3550000000,
            Type: "Audio",
          },
        ],
        TotalRecordCount: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await service.searchByTitle("Bohemian");

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "jellyfin_song1",
        title: "Bohemian Rhapsody",
        artist: "Queen",
      });
    });

    it("should authenticate if not already authenticated", async () => {
      // Create a new service that hasn't been authenticated
      const freshService = new JellyfinService();

      // First call: authentication
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ Id: "user123", Name: "test-user" }],
      } as Response);

      // Second call: search
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Items: [], TotalRecordCount: 0 }),
      } as Response);

      const result = await freshService.searchByTitle("test");

      expect(result).toHaveLength(0);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should throw if authentication fails", async () => {
      const freshService = new JellyfinService();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      await expect(freshService.searchByTitle("test")).rejects.toThrow(
        "Failed to authenticate with Jellyfin"
      );
    });

    it("should filter results to only include title matches", async () => {
      const mockResponse = {
        Items: [
          {
            Id: "song1",
            Name: "Love Story",
            Artists: ["Taylor Swift"],
            Album: "Fearless",
            RunTimeTicks: 2350000000,
            Type: "Audio",
          },
          {
            Id: "song2",
            Name: "Something Else",
            Artists: ["Other Artist"],
            Album: "Album",
            RunTimeTicks: 2000000000,
            Type: "Audio",
          },
        ],
        TotalRecordCount: 2,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await service.searchByTitle("love");

      // Only "Love Story" contains "love" in the title
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Love Story");
    });
  });

  describe("searchByArtist", () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ Id: "user123", Name: "test-user" }],
      } as Response);

      await service.authenticate();
      mockFetch.mockClear();
    });

    it("should fetch all audio items and filter by artist name", async () => {
      const mockResponse = {
        Items: [
          {
            Id: "song1",
            Name: "Song A",
            Artists: ["Beatles"],
            Album: "Abbey Road",
            RunTimeTicks: 2000000000,
            Type: "Audio",
          },
          {
            Id: "song2",
            Name: "Song B",
            Artists: ["Queen"],
            Album: "News of the World",
            RunTimeTicks: 1800000000,
            Type: "Audio",
          },
          {
            Id: "song3",
            Name: "Song C",
            Artists: ["Beatles"],
            Album: "Let It Be",
            RunTimeTicks: 2500000000,
            Type: "Audio",
          },
        ],
        TotalRecordCount: 3,
      };

      // Return fewer items than batch size to signal end of data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await service.searchByArtist("Beatles");

      expect(result).toHaveLength(2);
      expect(result[0].artist).toBe("Beatles");
      expect(result[1].artist).toBe("Beatles");
    });

    it("should paginate results via startIndex and limit", async () => {
      const items = Array.from({ length: 5 }, (_, i) => ({
        Id: `song${i}`,
        Name: `Song ${i}`,
        Artists: ["Target Artist"],
        Album: "Album",
        RunTimeTicks: 2000000000,
        Type: "Audio",
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Items: items, TotalRecordCount: 5 }),
      } as Response);

      const result = await service.searchByArtist("Target Artist", 2, 1);

      // Should return 2 items starting from index 1
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("Song 1");
      expect(result[1].title).toBe("Song 2");
    });

    it("should sort exact artist matches first", async () => {
      const items = [
        {
          Id: "song1",
          Name: "Song A",
          Artists: ["The Beatles Revival"],
          Album: "Album",
          RunTimeTicks: 2000000000,
          Type: "Audio",
        },
        {
          Id: "song2",
          Name: "Song B",
          Artists: ["Beatles"],
          Album: "Album",
          RunTimeTicks: 2000000000,
          Type: "Audio",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Items: items, TotalRecordCount: 2 }),
      } as Response);

      const result = await service.searchByArtist("beatles");

      // Exact match "Beatles" should come before partial match "The Beatles Revival"
      expect(result[0].artist).toBe("Beatles");
      expect(result[1].artist).toBe("The Beatles Revival");
    });

    it("should throw if authentication fails", async () => {
      const freshService = new JellyfinService();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      await expect(freshService.searchByArtist("test")).rejects.toThrow(
        "Failed to authenticate with Jellyfin"
      );
    });

    it("should use cache on subsequent calls with same query", async () => {
      const items = [
        {
          Id: "song1",
          Name: "Song A",
          Artists: ["Beatles"],
          Album: "Album",
          RunTimeTicks: 2000000000,
          Type: "Audio",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Items: items, TotalRecordCount: 1 }),
      } as Response);

      // First call - fetches from API
      await service.searchByArtist("beatles");

      // Second call - should use cache (no additional fetch calls)
      const result = await service.searchByArtist("beatles");

      expect(result).toHaveLength(1);
      // Only one fetch call should have been made
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("searchArtists", () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ Id: "user123", Name: "test-user" }],
      } as Response);

      await service.authenticate();
      mockFetch.mockClear();
    });

    it("should search for artists by name", async () => {
      const mockResponse = {
        Items: [
          {
            Id: "artist1",
            Name: "The Beatles",
            Type: "MusicArtist",
            ImageTags: { Primary: "abc123" },
          },
        ],
        TotalRecordCount: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await service.searchArtists("Beatles");

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "jellyfin_artist_artist1",
        name: "The Beatles",
        jellyfinId: "artist1",
      });
      expect(result[0].imageUrl).toContain("/Items/artist1/Images/Primary");
    });

    it("should handle empty search results", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Items: [], TotalRecordCount: 0 }),
      } as Response);

      const result = await service.searchArtists("NonexistentArtist");

      expect(result).toHaveLength(0);
    });

    it("should pass pagination parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Items: [], TotalRecordCount: 0 }),
      } as Response);

      await service.searchArtists("test", 25, 10);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=25"),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("startIndex=10"),
        expect.any(Object)
      );
    });

    it("should throw on API failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(service.searchArtists("test")).rejects.toThrow(
        "Artist search failed: 500"
      );
    });

    it("should filter non-MusicArtist items", async () => {
      const mockResponse = {
        Items: [
          {
            Id: "artist1",
            Name: "Beatles",
            Type: "MusicArtist",
          },
          {
            Id: "item2",
            Name: "Beatles Documentary",
            Type: "Movie",
          },
        ],
        TotalRecordCount: 2,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await service.searchArtists("Beatles");

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Beatles");
    });
  });

  describe("searchAlbums", () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ Id: "user123", Name: "test-user" }],
      } as Response);

      await service.authenticate();
      mockFetch.mockClear();
    });

    it("should search for albums by name", async () => {
      const mockResponse = {
        Items: [
          {
            Id: "album1",
            Name: "Abbey Road",
            Type: "MusicAlbum",
            Artists: ["The Beatles"],
            ProductionYear: 1969,
            Genres: ["Rock"],
            ImageTags: { Primary: "img123" },
            ChildCount: 17,
          },
        ],
        TotalRecordCount: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await service.searchAlbums("Abbey");

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "jellyfin_album_album1",
        name: "Abbey Road",
        artist: "The Beatles",
        jellyfinId: "album1",
        trackCount: 17,
        year: 1969,
        genre: "Rock",
      });
      expect(result[0].imageUrl).toContain("/Items/album1/Images/Primary");
    });

    it("should handle albums without optional fields", async () => {
      const mockResponse = {
        Items: [
          {
            Id: "album1",
            Name: "Unknown Album",
            Type: "MusicAlbum",
          },
        ],
        TotalRecordCount: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await service.searchAlbums("Unknown");

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: "Unknown Album",
        artist: "Unknown Artist",
      });
      expect(result[0].imageUrl).toBeUndefined();
      expect(result[0].trackCount).toBeUndefined();
    });

    it("should throw on API failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(service.searchAlbums("test")).rejects.toThrow(
        "Album search failed: 500"
      );
    });

    it("should pass pagination parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Items: [], TotalRecordCount: 0 }),
      } as Response);

      await service.searchAlbums("test", 20, 5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=20"),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("startIndex=5"),
        expect.any(Object)
      );
    });
  });

  describe("getSongsByAlbumId", () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ Id: "user123", Name: "test-user" }],
      } as Response);

      await service.authenticate();
      mockFetch.mockClear();
    });

    it("should get songs for a specific album", async () => {
      const mockResponse = {
        Items: [
          {
            Id: "song1",
            Name: "Come Together",
            Artists: ["The Beatles"],
            Album: "Abbey Road",
            RunTimeTicks: 2593000000,
            Type: "Audio",
          },
          {
            Id: "song2",
            Name: "Something",
            Artists: ["The Beatles"],
            Album: "Abbey Road",
            RunTimeTicks: 1820000000,
            Type: "Audio",
          },
        ],
        TotalRecordCount: 2,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await service.getSongsByAlbumId("album123");

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: "jellyfin_song1",
        title: "Come Together",
        artist: "The Beatles",
        album: "Abbey Road",
      });
      expect(result[1].title).toBe("Something");
    });

    it("should include parentId in the request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Items: [], TotalRecordCount: 0 }),
      } as Response);

      await service.getSongsByAlbumId("album456");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("parentId=album456"),
        expect.any(Object)
      );
    });

    it("should throw on API failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      await expect(service.getSongsByAlbumId("bad-id")).rejects.toThrow(
        "Get songs by album failed: 404"
      );
    });

    it("should support pagination", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Items: [], TotalRecordCount: 0 }),
      } as Response);

      await service.getSongsByAlbumId("album1", 10, 5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=10"),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("startIndex=5"),
        expect.any(Object)
      );
    });
  });

  describe("getSongsByArtistId", () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ Id: "user123", Name: "test-user" }],
      } as Response);

      await service.authenticate();
      mockFetch.mockClear();
    });

    it("should get songs for a specific artist", async () => {
      const mockResponse = {
        Items: [
          {
            Id: "song1",
            Name: "Bohemian Rhapsody",
            Artists: ["Queen"],
            Album: "A Night at the Opera",
            RunTimeTicks: 3550000000,
            Type: "Audio",
          },
        ],
        TotalRecordCount: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await service.getSongsByArtistId("artist789");

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "jellyfin_song1",
        title: "Bohemian Rhapsody",
        artist: "Queen",
        album: "A Night at the Opera",
      });
    });

    it("should include artistIds in the request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Items: [], TotalRecordCount: 0 }),
      } as Response);

      await service.getSongsByArtistId("artist123");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("artistIds=artist123"),
        expect.any(Object)
      );
    });

    it("should throw on API failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(service.getSongsByArtistId("bad-id")).rejects.toThrow(
        "Get songs by artist failed: 500"
      );
    });

    it("should support pagination", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Items: [], TotalRecordCount: 0 }),
      } as Response);

      await service.getSongsByArtistId("artist1", 15, 10);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=15"),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("startIndex=10"),
        expect.any(Object)
      );
    });
  });

  describe("getLyrics", () => {
    const mockHeaders = {
      entries: () => [["content-type", "application/json"]],
    };

    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ Id: "user123", Name: "test-user" }],
      } as Response);

      await service.authenticate();
      mockFetch.mockClear();
    });

    it("should return lyrics array when API returns array", async () => {
      const mockLyrics = [
        { Start: 0, Text: "First line" },
        { Start: 5000000, Text: "Second line" },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: async () => mockLyrics,
      } as unknown as Response);

      const result = await service.getLyrics("song123");

      expect(result).toEqual(mockLyrics);
    });

    it("should return Lyrics field when present in response object", async () => {
      const mockLyrics = [
        { Start: 0, Text: "Line 1" },
        { Start: 3000000, Text: "Line 2" },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: async () => ({ Lyrics: mockLyrics }),
      } as unknown as Response);

      const result = await service.getLyrics("song123");

      expect(result).toEqual(mockLyrics);
    });

    it("should return string lyrics when response is a string", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: async () => "These are raw lyrics text",
      } as unknown as Response);

      const result = await service.getLyrics("song123");

      expect(result).toBe("These are raw lyrics text");
    });

    it("should return lowercase lyrics field when present", async () => {
      const mockLyrics = "Some lyrics text";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: async () => ({ lyrics: mockLyrics }),
      } as unknown as Response);

      const result = await service.getLyrics("song123");

      expect(result).toBe(mockLyrics);
    });

    it("should return null when lyrics endpoint fails and no embedded lyrics found", async () => {
      // First fetch: lyrics endpoint fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: mockHeaders,
        text: async () => "Not found",
      } as unknown as Response);

      // Second fetch: item details (no lyrics streams)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          MediaSources: [
            {
              MediaStreams: [{ Type: "Audio", Codec: "mp3" }],
            },
          ],
        }),
      } as Response);

      const result = await service.getLyrics("song123");

      expect(result).toBeNull();
    });

    it("should try subtitle streams for embedded lyrics when direct endpoint fails", async () => {
      // First fetch: lyrics endpoint fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: mockHeaders,
        text: async () => "Not found",
      } as unknown as Response);

      // Second fetch: item details with lyrics stream
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          MediaSources: [
            {
              MediaStreams: [
                { Type: "Audio", Codec: "mp3", Index: 0 },
                {
                  Type: "Subtitle",
                  Codec: "lrc",
                  Index: 1,
                  DisplayTitle: "Lyrics",
                },
              ],
            },
          ],
        }),
      } as Response);

      // Third fetch: subtitle stream content
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "[00:00.00]First line\n[00:05.00]Second line",
      } as Response);

      const result = await service.getLyrics("song123");

      expect(result).toBe("[00:00.00]First line\n[00:05.00]Second line");
    });

    it("should return null on network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await service.getLyrics("song123");

      expect(result).toBeNull();
    });

    it("should authenticate if not already authenticated", async () => {
      const freshService = new JellyfinService();

      // Auth call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ Id: "user123", Name: "test-user" }],
      } as Response);

      // Lyrics call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: async () => [{ Start: 0, Text: "Lyrics" }],
      } as unknown as Response);

      const result = await freshService.getLyrics("song123");

      expect(result).toEqual([{ Start: 0, Text: "Lyrics" }]);
    });
  });

  describe("getLibraries", () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ Id: "user123", Name: "test-user" }],
      } as Response);

      await service.authenticate();
      mockFetch.mockClear();
    });

    it("should return libraries on success", async () => {
      const mockLibraries = {
        Items: [
          { Name: "Music", Id: "lib1", CollectionType: "music" },
          { Name: "Videos", Id: "lib2", CollectionType: "movies" },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLibraries,
      } as Response);

      const result = await service.getLibraries();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        Name: "Music",
        Id: "lib1",
        CollectionType: "music",
      });
      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.jellyfin.com/Users/user123/Views",
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Emby-Token": "test-api-key",
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should return empty array when response is not ok", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const result = await service.getLibraries();

      expect(result).toEqual([]);
    });

    it("should return empty array when fetch throws", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await service.getLibraries();

      expect(result).toEqual([]);
    });

    it("should authenticate first when not already authenticated", async () => {
      const freshService = new JellyfinService();

      // First call: authentication
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ Id: "user123", Name: "test-user" }],
      } as Response);

      // Second call: getLibraries
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Items: [{ Name: "Music", Id: "lib1", CollectionType: "music" }],
        }),
      } as Response);

      const result = await freshService.getLibraries();

      expect(result).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("getAllAudioItems", () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ Id: "user123", Name: "test-user" }],
      } as Response);

      await service.authenticate();
      mockFetch.mockClear();
    });

    it("should fetch all audio items with default pagination", async () => {
      const mockResponse = {
        Items: [
          {
            Id: "song1",
            Name: "Song One",
            Artists: ["Artist A"],
            Album: "Album 1",
            RunTimeTicks: 2000000000,
            Type: "Audio",
          },
          {
            Id: "song2",
            Name: "Song Two",
            Artists: ["Artist B"],
            Album: "Album 2",
            RunTimeTicks: 3000000000,
            Type: "Audio",
          },
        ],
        TotalRecordCount: 2,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await service.getAllAudioItems();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: "jellyfin_song1",
        title: "Song One",
        artist: "Artist A",
      });
      expect(result[1]).toMatchObject({
        id: "jellyfin_song2",
        title: "Song Two",
        artist: "Artist B",
      });
    });

    it("should pass startIndex and limit parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Items: [], TotalRecordCount: 0 }),
      } as Response);

      await service.getAllAudioItems(20, 50);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("startIndex=20"),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=50"),
        expect.any(Object)
      );
    });

    it("should throw on API failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);

      await expect(service.getAllAudioItems()).rejects.toThrow(
        "Failed to fetch audio items: 500"
      );
    });

    it("should convert RunTimeTicks to seconds", async () => {
      const mockResponse = {
        Items: [
          {
            Id: "song1",
            Name: "Three Minute Song",
            Artists: ["Artist"],
            Album: "Album",
            RunTimeTicks: 1800000000, // 180 seconds = 3 minutes
            Type: "Audio",
          },
        ],
        TotalRecordCount: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await service.getAllAudioItems();

      expect(result[0].duration).toBe(180);
    });

    it("should handle items with missing optional fields", async () => {
      const mockResponse = {
        Items: [
          {
            Id: "song1",
            Name: "Minimal Song",
            Type: "Audio",
          },
        ],
        TotalRecordCount: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await service.getAllAudioItems();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        title: "Minimal Song",
        artist: "Unknown Artist",
        duration: 0,
      });
    });
  });

  describe("getDirectStreamUrl", () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ Id: "user123", Name: "test-user" }],
      } as Response);

      await service.authenticate();
      mockFetch.mockClear();
    });

    it("should generate correct direct stream URL", async () => {
      const url = await service.getDirectStreamUrl("song123");

      expect(url).toContain(
        "https://test.jellyfin.com/Audio/song123/universal"
      );
      expect(url).toContain("userId=user123");
      expect(url).toContain("api_key=test-api-key");
      expect(url).toContain("container=mp3,aac,m4a,flac,webma,webm,wav,ogg");
    });

    it("should authenticate if not already authenticated", async () => {
      const freshService = new JellyfinService();

      // Auth call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ Id: "user123", Name: "test-user" }],
      } as Response);

      const url = await freshService.getDirectStreamUrl("song456");

      expect(url).toContain("/Audio/song456/universal");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("hasLyrics", () => {
    const mockHeaders = {
      entries: () => [["content-type", "application/json"]],
    };

    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ Id: "user123", Name: "test-user" }],
      } as Response);

      await service.authenticate();
      mockFetch.mockClear();
    });

    it("should return true when lyrics array has text content", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: async () => [
          { Start: 0, Text: "Hello" },
          { Start: 5000, Text: "World" },
        ],
      } as unknown as Response);

      const result = await service.hasLyrics("song123");

      expect(result).toBe(true);
    });

    it("should return false when lyrics array is empty", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: async () => [],
      } as unknown as Response);

      const result = await service.hasLyrics("song123");

      // Empty array returns false because lyrics.length === 0
      expect(result).toBe(false);
    });

    it("should return true for non-empty string lyrics", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: async () => "Some lyrics content",
      } as unknown as Response);

      const result = await service.hasLyrics("song123");

      expect(result).toBe(true);
    });

    it("should return false for whitespace-only string lyrics", async () => {
      // getLyrics returns "   " which is a string.
      // hasLyrics checks: typeof lyrics === "string" && lyrics.trim().length > 0
      // "   ".trim().length === 0, so returns false
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: async () => "   ",
      } as unknown as Response);

      const result = await service.hasLyrics("song123");

      expect(result).toBe(false);
    });

    it("should return false when getLyrics returns null", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await service.hasLyrics("song123");

      expect(result).toBe(false);
    });
  });
});
