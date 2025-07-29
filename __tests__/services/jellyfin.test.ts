// Unit tests for Jellyfin service
import { JellyfinService } from "@/services/jellyfin";

// Mock fetch globally
global.fetch = jest.fn();

describe("JellyfinService", () => {
  let service: JellyfinService;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    // Set up environment variables
    process.env.JELLYFIN_SERVER_URL = "https://test.jellyfin.com";
    process.env.JELLYFIN_API_KEY = "test-api-key";
    process.env.JELLYFIN_USERNAME = "test-user";

    service = new JellyfinService();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
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
      expect(result[0]).toEqual({
        id: "jellyfin_song123",
        title: "Test Song",
        artist: "Test Artist",
        album: "Test Album",
        duration: 180, // 3 minutes in seconds
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

      expect(result).toEqual({
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
});
