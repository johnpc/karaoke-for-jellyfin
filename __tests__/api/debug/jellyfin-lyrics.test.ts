import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockAuthenticate = vi.fn();
const mockGetLyrics = vi.fn();
const mockHasLyrics = vi.fn();
const mockGetMediaMetadata = vi.fn();

vi.mock("@/services/jellyfin", () => ({
  getJellyfinService: () => ({
    authenticate: mockAuthenticate,
    getLyrics: mockGetLyrics,
    hasLyrics: mockHasLyrics,
    getMediaMetadata: mockGetMediaMetadata,
  }),
}));

import { GET } from "@/app/api/debug/jellyfin-lyrics/route";

describe("GET /api/debug/jellyfin-lyrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when itemId parameter is missing", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/debug/jellyfin-lyrics"
    );

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("itemId parameter required");
  });

  it("returns 401 when authentication fails", async () => {
    mockAuthenticate.mockResolvedValue(false);

    const request = new NextRequest(
      "http://localhost:3000/api/debug/jellyfin-lyrics?itemId=song-123"
    );

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Failed to authenticate with Jellyfin");
  });

  it("returns lyrics info when authenticated and lyrics exist", async () => {
    mockAuthenticate.mockResolvedValue(true);
    mockGetLyrics.mockResolvedValue("Line 1\nLine 2\nLine 3");
    mockHasLyrics.mockResolvedValue(true);
    mockGetMediaMetadata.mockResolvedValue({
      title: "Bohemian Rhapsody",
      artist: "Queen",
      album: "A Night at the Opera",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/debug/jellyfin-lyrics?itemId=song-123"
    );

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.itemId).toBe("song-123");
    expect(json.hasLyrics).toBe(true);
    expect(json.lyricsLength).toBe(20);
    expect(json.metadata).toEqual({
      title: "Bohemian Rhapsody",
      artist: "Queen",
      album: "A Night at the Opera",
    });
  });

  it("returns null lyricsPreview when lyrics is not a string", async () => {
    mockAuthenticate.mockResolvedValue(true);
    mockGetLyrics.mockResolvedValue([{ time: 0, text: "Line 1" }]);
    mockHasLyrics.mockResolvedValue(true);
    mockGetMediaMetadata.mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/debug/jellyfin-lyrics?itemId=song-456"
    );

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.itemId).toBe("song-456");
    expect(json.hasLyrics).toBe(true);
    expect(json.lyricsPreview).toBeNull();
    expect(json.metadata).toBeNull();
  });

  it("returns lyricsLength 0 when lyrics is null", async () => {
    mockAuthenticate.mockResolvedValue(true);
    mockGetLyrics.mockResolvedValue(null);
    mockHasLyrics.mockResolvedValue(false);
    mockGetMediaMetadata.mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/debug/jellyfin-lyrics?itemId=song-789"
    );

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.lyricsLength).toBe(0);
    expect(json.hasLyrics).toBe(false);
    expect(json.lyricsPreview).toBeNull();
  });

  it("includes fullLyrics in development mode", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    mockAuthenticate.mockResolvedValue(true);
    mockGetLyrics.mockResolvedValue("Full lyrics content");
    mockHasLyrics.mockResolvedValue(true);
    mockGetMediaMetadata.mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/debug/jellyfin-lyrics?itemId=song-dev"
    );

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.fullLyrics).toBe("Full lyrics content");

    process.env.NODE_ENV = originalNodeEnv;
  });

  it("excludes fullLyrics in production mode", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    mockAuthenticate.mockResolvedValue(true);
    mockGetLyrics.mockResolvedValue("Full lyrics content");
    mockHasLyrics.mockResolvedValue(true);
    mockGetMediaMetadata.mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/debug/jellyfin-lyrics?itemId=song-prod"
    );

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.fullLyrics).toBeNull();

    process.env.NODE_ENV = originalNodeEnv;
  });

  it("returns 500 when an unexpected error occurs", async () => {
    mockAuthenticate.mockRejectedValue(new Error("Connection timeout"));

    const request = new NextRequest(
      "http://localhost:3000/api/debug/jellyfin-lyrics?itemId=song-err"
    );

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Jellyfin lyrics test failed");
    expect(json.details).toBe("Connection timeout");
  });

  it("returns 500 with 'Unknown error' for non-Error thrown values", async () => {
    mockAuthenticate.mockRejectedValue("some string error");

    const request = new NextRequest(
      "http://localhost:3000/api/debug/jellyfin-lyrics?itemId=song-err2"
    );

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.details).toBe("Unknown error");
  });
});
