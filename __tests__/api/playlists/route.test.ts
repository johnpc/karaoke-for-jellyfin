import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockHealthCheck = vi.fn();
const mockGetPlaylists = vi.fn();

vi.mock("@/services/jellyfin-sdk", () => ({
  getJellyfinSDKService: () => ({
    healthCheck: mockHealthCheck,
    getPlaylists: mockGetPlaylists,
  }),
}));

import { GET } from "@/app/api/playlists/route";

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("GET /api/playlists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHealthCheck.mockResolvedValue(true);
    delete process.env.PLAYLIST_FILTER_REGEX;
  });

  it("returns playlists successfully", async () => {
    const mockPlaylists = [
      { id: "1", name: "Karaoke Hits" },
      { id: "2", name: "Rock Classics" },
    ];
    mockGetPlaylists.mockResolvedValue(mockPlaylists);

    const request = createRequest("http://localhost:3000/api/playlists");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockPlaylists);
    expect(json.pagination).toBeDefined();
    expect(mockGetPlaylists).toHaveBeenCalledWith(50, 0);
  });

  it("filters playlists by PLAYLIST_FILTER_REGEX", async () => {
    process.env.PLAYLIST_FILTER_REGEX = "karaoke";
    const mockPlaylists = [
      { id: "1", name: "Karaoke Hits" },
      { id: "2", name: "Rock Classics" },
      { id: "3", name: "Karaoke Party" },
    ];
    mockGetPlaylists.mockResolvedValue(mockPlaylists);

    const request = createRequest("http://localhost:3000/api/playlists");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].name).toBe("Karaoke Hits");
    expect(json.data[1].name).toBe("Karaoke Party");
  });

  it("deduplicates playlists by normalized name", async () => {
    const mockPlaylists = [
      { id: "1", name: "My Playlist" },
      { id: "2", name: "my playlist" },
      { id: "3", name: "  My Playlist  " },
    ];
    mockGetPlaylists.mockResolvedValue(mockPlaylists);

    const request = createRequest("http://localhost:3000/api/playlists");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].name).toBe("My Playlist");
  });

  it("returns 503 when jellyfin is unavailable", async () => {
    mockHealthCheck.mockResolvedValue(false);

    const request = createRequest("http://localhost:3000/api/playlists");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("JELLYFIN_UNAVAILABLE");
  });

  it("respects limit and startIndex params", async () => {
    mockGetPlaylists.mockResolvedValue([]);

    const request = createRequest(
      "http://localhost:3000/api/playlists?limit=10&startIndex=5"
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockGetPlaylists).toHaveBeenCalledWith(10, 5);
  });

  it("returns 500 on unexpected error", async () => {
    mockHealthCheck.mockRejectedValue(new Error("Unexpected"));

    const request = createRequest("http://localhost:3000/api/playlists");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("PLAYLIST_FETCH_FAILED");
  });
});
