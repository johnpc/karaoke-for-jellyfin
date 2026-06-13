import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetSongsByAlbumId = vi.fn();

vi.mock("@/services/jellyfin", () => ({
  getJellyfinService: () => ({
    getSongsByAlbumId: mockGetSongsByAlbumId,
  }),
}));

import { GET } from "@/app/api/albums/[id]/songs/route";

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("GET /api/albums/[id]/songs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns songs for a given album ID", async () => {
    const mockSongs = [
      { id: "1", title: "Come Together", artist: "The Beatles" },
      { id: "2", title: "Something", artist: "The Beatles" },
    ];
    mockGetSongsByAlbumId.mockResolvedValue(mockSongs);

    const request = createRequest(
      "http://localhost:3000/api/albums/album123/songs"
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: "album123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockSongs);
    expect(mockGetSongsByAlbumId).toHaveBeenCalledWith("album123", 50, 0);
  });

  it("strips jellyfin_album_ prefix from album ID", async () => {
    mockGetSongsByAlbumId.mockResolvedValue([]);

    const request = createRequest(
      "http://localhost:3000/api/albums/jellyfin_album_xyz/songs"
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: "jellyfin_album_xyz" }),
    });

    expect(response.status).toBe(200);
    expect(mockGetSongsByAlbumId).toHaveBeenCalledWith("xyz", 50, 0);
  });

  it("passes limit and startIndex to service", async () => {
    mockGetSongsByAlbumId.mockResolvedValue([]);

    const request = createRequest(
      "http://localhost:3000/api/albums/album123/songs?limit=10&startIndex=5"
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: "album123" }),
    });

    expect(response.status).toBe(200);
    expect(mockGetSongsByAlbumId).toHaveBeenCalledWith("album123", 10, 5);
  });

  it("returns 500 on unexpected error", async () => {
    mockGetSongsByAlbumId.mockRejectedValue(new Error("Database error"));

    const request = createRequest(
      "http://localhost:3000/api/albums/album123/songs"
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: "album123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("ALBUM_SONGS_FETCH_FAILED");
  });
});
