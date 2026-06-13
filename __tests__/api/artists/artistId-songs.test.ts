import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockHealthCheck = vi.fn();
const mockGetSongsByArtistId = vi.fn();

vi.mock("@/services/jellyfin-sdk", () => ({
  getJellyfinSDKService: () => ({
    healthCheck: mockHealthCheck,
    getSongsByArtistId: mockGetSongsByArtistId,
  }),
}));

import { GET } from "@/app/api/artists/[artistId]/songs/route";

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("GET /api/artists/[artistId]/songs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHealthCheck.mockResolvedValue(true);
  });

  it("returns songs for a given artist ID", async () => {
    const mockResult = {
      songs: [{ id: "1", title: "Song 1", artist: "Artist" }],
      totalCount: 1,
    };
    mockGetSongsByArtistId.mockResolvedValue(mockResult);

    const request = createRequest(
      "http://localhost:3000/api/artists/abc123/songs"
    );
    const response = await GET(request, {
      params: Promise.resolve({ artistId: "abc123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockResult.songs);
    expect(json.pagination).toBeDefined();
    expect(mockGetSongsByArtistId).toHaveBeenCalledWith("abc123", 50, 0);
  });

  it("strips jellyfin_artist_ prefix from artistId", async () => {
    const mockResult = { songs: [], totalCount: 0 };
    mockGetSongsByArtistId.mockResolvedValue(mockResult);

    const request = createRequest(
      "http://localhost:3000/api/artists/jellyfin_artist_xyz/songs"
    );
    const response = await GET(request, {
      params: Promise.resolve({ artistId: "jellyfin_artist_xyz" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(mockGetSongsByArtistId).toHaveBeenCalledWith("xyz", 50, 0);
  });

  it("returns 503 when jellyfin is unavailable", async () => {
    mockHealthCheck.mockResolvedValue(false);

    const request = createRequest(
      "http://localhost:3000/api/artists/abc123/songs"
    );
    const response = await GET(request, {
      params: Promise.resolve({ artistId: "abc123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("JELLYFIN_UNAVAILABLE");
  });

  it("respects limit and startIndex params", async () => {
    const mockResult = { songs: [], totalCount: 0 };
    mockGetSongsByArtistId.mockResolvedValue(mockResult);

    const request = createRequest(
      "http://localhost:3000/api/artists/abc123/songs?limit=10&startIndex=20"
    );
    const response = await GET(request, {
      params: Promise.resolve({ artistId: "abc123" }),
    });

    expect(response.status).toBe(200);
    expect(mockGetSongsByArtistId).toHaveBeenCalledWith("abc123", 10, 20);
  });

  it("returns 500 on unexpected error", async () => {
    mockHealthCheck.mockRejectedValue(new Error("Database error"));

    const request = createRequest(
      "http://localhost:3000/api/artists/abc123/songs"
    );
    const response = await GET(request, {
      params: Promise.resolve({ artistId: "abc123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("GET_SONGS_BY_ARTIST_FAILED");
  });
});
