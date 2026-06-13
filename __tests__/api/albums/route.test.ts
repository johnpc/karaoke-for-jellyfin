import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSearchAlbums = vi.fn();

vi.mock("@/services/jellyfin", () => ({
  getJellyfinService: () => ({
    searchAlbums: mockSearchAlbums,
  }),
}));

import { GET } from "@/app/api/albums/route";

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("GET /api/albums", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns albums matching search query", async () => {
    const mockAlbums = [{ id: "1", name: "Abbey Road", artist: "The Beatles" }];
    mockSearchAlbums.mockResolvedValue(mockAlbums);

    const request = createRequest("http://localhost:3000/api/albums?q=abbey");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockAlbums);
    expect(mockSearchAlbums).toHaveBeenCalledWith("abbey", 50, 0);
  });

  it("returns empty array when no query is provided", async () => {
    const request = createRequest("http://localhost:3000/api/albums");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual([]);
    expect(mockSearchAlbums).not.toHaveBeenCalled();
  });

  it("returns empty array when query is whitespace only", async () => {
    const request = createRequest("http://localhost:3000/api/albums?q=%20%20");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual([]);
  });

  it("passes limit and startIndex to service", async () => {
    mockSearchAlbums.mockResolvedValue([]);

    const request = createRequest(
      "http://localhost:3000/api/albums?q=test&limit=25&startIndex=10"
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockSearchAlbums).toHaveBeenCalledWith("test", 25, 10);
  });

  it("returns 500 on unexpected error", async () => {
    mockSearchAlbums.mockRejectedValue(new Error("Service error"));

    const request = createRequest("http://localhost:3000/api/albums?q=test");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("ALBUMS_SEARCH_FAILED");
  });
});
