import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockHealthCheck = vi.fn();
const mockGetPlaylistItems = vi.fn();

vi.mock("@/services/jellyfin-sdk", () => ({
  getJellyfinSDKService: () => ({
    healthCheck: mockHealthCheck,
    getPlaylistItems: mockGetPlaylistItems,
  }),
}));

import { GET } from "@/app/api/playlists/[playlistId]/items/route";

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("GET /api/playlists/[playlistId]/items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHealthCheck.mockResolvedValue(true);
  });

  it("returns playlist items for a given playlist ID", async () => {
    const mockItems = [
      { id: "1", title: "Song 1", artist: "Artist 1" },
      { id: "2", title: "Song 2", artist: "Artist 2" },
    ];
    mockGetPlaylistItems.mockResolvedValue(mockItems);

    const request = createRequest(
      "http://localhost:3000/api/playlists/pl123/items"
    );
    const response = await GET(request, {
      params: Promise.resolve({ playlistId: "pl123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockItems);
    expect(json.pagination).toBeDefined();
    expect(mockGetPlaylistItems).toHaveBeenCalledWith("pl123", 50, 0);
  });

  it("strips jellyfin_playlist_ prefix from playlist ID", async () => {
    mockGetPlaylistItems.mockResolvedValue([]);

    const request = createRequest(
      "http://localhost:3000/api/playlists/jellyfin_playlist_abc/items"
    );
    const response = await GET(request, {
      params: Promise.resolve({ playlistId: "jellyfin_playlist_abc" }),
    });

    expect(response.status).toBe(200);
    expect(mockGetPlaylistItems).toHaveBeenCalledWith("abc", 50, 0);
  });

  it("returns 503 when jellyfin is unavailable", async () => {
    mockHealthCheck.mockResolvedValue(false);

    const request = createRequest(
      "http://localhost:3000/api/playlists/pl123/items"
    );
    const response = await GET(request, {
      params: Promise.resolve({ playlistId: "pl123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("JELLYFIN_UNAVAILABLE");
  });

  it("respects limit and startIndex params", async () => {
    mockGetPlaylistItems.mockResolvedValue([]);

    const request = createRequest(
      "http://localhost:3000/api/playlists/pl123/items?limit=10&startIndex=20"
    );
    const response = await GET(request, {
      params: Promise.resolve({ playlistId: "pl123" }),
    });

    expect(response.status).toBe(200);
    expect(mockGetPlaylistItems).toHaveBeenCalledWith("pl123", 10, 20);
  });

  it("returns 500 on unexpected error", async () => {
    mockHealthCheck.mockRejectedValue(new Error("Network error"));

    const request = createRequest(
      "http://localhost:3000/api/playlists/pl123/items"
    );
    const response = await GET(request, {
      params: Promise.resolve({ playlistId: "pl123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("PLAYLIST_ITEMS_FETCH_FAILED");
  });
});
