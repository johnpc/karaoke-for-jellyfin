import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockAuthenticate = vi.fn();
const mockGetDirectStreamUrl = vi.fn();

vi.mock("@/services/jellyfin", () => ({
  getJellyfinService: () => ({
    authenticate: mockAuthenticate,
    getDirectStreamUrl: mockGetDirectStreamUrl,
  }),
}));

// Mock global fetch for the stream URL test
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { GET } from "@/app/api/debug/stream-test/route";

describe("GET /api/debug/stream-test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JELLYFIN_API_KEY = "test-api-key";
  });

  it("returns 400 when itemId parameter is missing", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/debug/stream-test"
    );

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("itemId parameter required");
  });

  it("returns 401 when authentication fails", async () => {
    mockAuthenticate.mockResolvedValue(false);

    const request = new NextRequest(
      "http://localhost:3000/api/debug/stream-test?itemId=song-123"
    );

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Failed to authenticate with Jellyfin");
  });

  it("returns stream info when stream URL is accessible", async () => {
    mockAuthenticate.mockResolvedValue(true);
    mockGetDirectStreamUrl.mockResolvedValue(
      "http://jellyfin:8096/Audio/song-123/universal?userId=user1&api_key=key"
    );

    const mockHeaders = new Headers({
      "content-type": "audio/mpeg",
      "content-length": "5242880",
    });

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: mockHeaders,
    });

    const request = new NextRequest(
      "http://localhost:3000/api/debug/stream-test?itemId=song-123"
    );

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.itemId).toBe("song-123");
    expect(json.streamUrl).toBe(
      "http://jellyfin:8096/Audio/song-123/universal?userId=user1&api_key=key"
    );
    expect(json.accessible).toBe(true);
    expect(json.status).toBe(200);
    expect(json.statusText).toBe("OK");
    expect(json.contentType).toBe("audio/mpeg");
    expect(json.contentLength).toBe("5242880");

    // Verify fetch was called with HEAD method and correct headers
    expect(mockFetch).toHaveBeenCalledWith(
      "http://jellyfin:8096/Audio/song-123/universal?userId=user1&api_key=key",
      {
        method: "HEAD",
        headers: {
          "X-Emby-Token": "test-api-key",
          "User-Agent": "Karaoke-For-Jellyfin/1.0",
        },
      }
    );
  });

  it("returns accessible false when stream URL is not reachable", async () => {
    mockAuthenticate.mockResolvedValue(true);
    mockGetDirectStreamUrl.mockResolvedValue(
      "http://jellyfin:8096/Audio/song-404/universal"
    );

    const mockHeaders = new Headers({});

    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      headers: mockHeaders,
    });

    const request = new NextRequest(
      "http://localhost:3000/api/debug/stream-test?itemId=song-404"
    );

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.accessible).toBe(false);
    expect(json.status).toBe(404);
    expect(json.statusText).toBe("Not Found");
  });

  it("returns 500 when an unexpected error occurs", async () => {
    mockAuthenticate.mockRejectedValue(new Error("Network failure"));

    const request = new NextRequest(
      "http://localhost:3000/api/debug/stream-test?itemId=song-err"
    );

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Stream test failed");
    expect(json.details).toBe("Network failure");
  });

  it("returns 500 with 'Unknown error' for non-Error thrown values", async () => {
    mockAuthenticate.mockRejectedValue(42);

    const request = new NextRequest(
      "http://localhost:3000/api/debug/stream-test?itemId=song-err2"
    );

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.details).toBe("Unknown error");
  });

  it("uses empty string for JELLYFIN_API_KEY when not set", async () => {
    delete process.env.JELLYFIN_API_KEY;

    mockAuthenticate.mockResolvedValue(true);
    mockGetDirectStreamUrl.mockResolvedValue(
      "http://jellyfin:8096/Audio/test/universal"
    );

    const mockHeaders = new Headers({});
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: mockHeaders,
    });

    const request = new NextRequest(
      "http://localhost:3000/api/debug/stream-test?itemId=test"
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Emby-Token": "",
        }),
      })
    );
  });
});
