import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockHealthCheck = vi.fn();
const mockSearchMedia = vi.fn();
const mockGetAllAudioItems = vi.fn();
const mockGetMediaMetadata = vi.fn();

vi.mock("@/services/jellyfin", () => ({
  getJellyfinService: () => ({
    healthCheck: mockHealthCheck,
    searchMedia: mockSearchMedia,
    getAllAudioItems: mockGetAllAudioItems,
    getMediaMetadata: mockGetMediaMetadata,
  }),
}));

vi.mock("@/lib/validation", () => ({
  ValidationError: class ValidationError extends Error {
    code: string;
    field?: string;
    constructor(message: string, code = "INVALID_REQUEST", field?: string) {
      super(message);
      this.name = "ValidationError";
      this.code = code;
      this.field = field;
    }
  },
  validateSearchRequest: vi.fn(),
}));

import { GET, POST } from "@/app/api/songs/route";

function createRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), options);
}

describe("GET /api/songs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHealthCheck.mockResolvedValue(true);
  });

  it("returns all songs when no query is provided", async () => {
    const mockSongs = [
      { id: "1", title: "Song 1", artist: "Artist 1" },
      { id: "2", title: "Song 2", artist: "Artist 2" },
    ];
    mockGetAllAudioItems.mockResolvedValue(mockSongs);

    const request = createRequest("http://localhost:3000/api/songs");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockSongs);
    expect(json.pagination).toBeDefined();
    expect(mockGetAllAudioItems).toHaveBeenCalledWith(0, 50);
  });

  it("searches songs when query is provided", async () => {
    const mockSongs = [
      { id: "1", title: "Bohemian Rhapsody", artist: "Queen" },
    ];
    mockSearchMedia.mockResolvedValue(mockSongs);

    const request = createRequest(
      "http://localhost:3000/api/songs?q=bohemian&limit=10"
    );
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockSongs);
    expect(mockSearchMedia).toHaveBeenCalledWith("bohemian", 10);
  });

  it("returns 503 when jellyfin is unavailable", async () => {
    mockHealthCheck.mockResolvedValue(false);

    const request = createRequest("http://localhost:3000/api/songs");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("JELLYFIN_UNAVAILABLE");
  });

  it("returns 400 for invalid search request", async () => {
    const { validateSearchRequest } = await import("@/lib/validation");
    const { ValidationError } = await import("@/lib/validation");
    vi.mocked(validateSearchRequest).mockImplementation(() => {
      throw new ValidationError("Query too short");
    });

    const request = createRequest("http://localhost:3000/api/songs?q=a");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_SEARCH");
  });

  it("returns 500 on unexpected error", async () => {
    mockHealthCheck.mockRejectedValue(new Error("Connection failed"));

    const request = createRequest("http://localhost:3000/api/songs");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("SONGS_FETCH_FAILED");
  });
});

describe("POST /api/songs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHealthCheck.mockResolvedValue(true);
  });

  it("returns song metadata for valid itemId", async () => {
    const mockSong = {
      id: "abc123",
      title: "Test Song",
      artist: "Test Artist",
    };
    mockGetMediaMetadata.mockResolvedValue(mockSong);

    const request = createRequest("http://localhost:3000/api/songs", {
      method: "POST",
      body: JSON.stringify({ itemId: "abc123" }),
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.song).toEqual(mockSong);
  });

  it("returns 400 when itemId is missing", async () => {
    const request = createRequest("http://localhost:3000/api/songs", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_REQUEST");
  });

  it("returns 400 when itemId is empty string", async () => {
    const request = createRequest("http://localhost:3000/api/songs", {
      method: "POST",
      body: JSON.stringify({ itemId: "   " }),
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_REQUEST");
  });

  it("returns 404 when song is not found", async () => {
    mockGetMediaMetadata.mockResolvedValue(null);

    const request = createRequest("http://localhost:3000/api/songs", {
      method: "POST",
      body: JSON.stringify({ itemId: "nonexistent" }),
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("SONG_NOT_FOUND");
  });

  it("returns 503 when jellyfin is unavailable", async () => {
    mockHealthCheck.mockResolvedValue(false);

    const request = createRequest("http://localhost:3000/api/songs", {
      method: "POST",
      body: JSON.stringify({ itemId: "abc123" }),
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("JELLYFIN_UNAVAILABLE");
  });

  it("returns 500 on unexpected error", async () => {
    mockHealthCheck.mockRejectedValue(new Error("Connection failed"));

    const request = createRequest("http://localhost:3000/api/songs", {
      method: "POST",
      body: JSON.stringify({ itemId: "abc123" }),
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("SONG_METADATA_FAILED");
  });
});
