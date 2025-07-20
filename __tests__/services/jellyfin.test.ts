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

      expect(() => new JellyfinService()).toThrow(
        "JELLYFIN_SERVER_URL and JELLYFIN_API_KEY must be configured",
      );
    });
  });

  describe("authenticate", () => {
    it("should authenticate successfully", async () => {
      const mockUsers = [{ Id: "user123", Name: "TestUser" }];

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
        }),
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
        json: async () => [{ Id: "user123", Name: "TestUser" }],
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      } as Response);

      const result = await service.searchMedia("test query");

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "jellyfin_song123",
        title: "Test Song",
        artist: "Test Artist",
        album: "Test Album",
        duration: 180, // 3 minutes in seconds
        jellyfinId: "song123",
        streamUrl:
          "https://test.jellyfin.com/Audio/song123/stream?api_key=test-api-key",
        lyricsPath: undefined,
      });
    });

    it("should handle search errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(service.searchMedia("test")).rejects.toThrow(
        "Search failed: 500",
      );
    });
  });

  describe("getStreamUrl", () => {
    it("should generate correct stream URL", () => {
      const url = service.getStreamUrl("song123");

      expect(url).toBe(
        "https://test.jellyfin.com/Audio/song123/stream?api_key=test-api-key",
      );
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
        }),
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
        json: async () => [{ Id: "user123", Name: "TestUser" }],
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
        streamUrl:
          "https://test.jellyfin.com/Audio/song123/stream?api_key=test-api-key",
        lyricsPath: undefined,
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
