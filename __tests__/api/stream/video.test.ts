import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetDirectStreamUrl = vi.fn();
const mockEnsureAuth = vi.fn();

vi.mock("@/services/jellyfin", () => ({
  getJellyfinService: () => ({
    getDirectStreamUrl: mockGetDirectStreamUrl,
    ensureAuth: mockEnsureAuth,
  }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { GET } from "@/app/api/stream/[itemId]/route";

function request(url: string, headers?: Record<string, string>) {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    headers: headers ? new Headers(headers) : undefined,
  });
}

function upstream(status: number, headers: Record<string, string>) {
  return {
    ok: status < 400,
    status,
    headers: new Headers(headers),
    body: new ReadableStream(),
  };
}

describe("GET /api/stream/[itemId]?type=video", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnsureAuth.mockResolvedValue({
      baseUrl: "http://jellyfin:8096",
      apiKey: "secret",
      userId: "u1",
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("proxies the Jellyfin static video stream (token stays server-side)", async () => {
    mockFetch.mockResolvedValue(
      upstream(200, { "content-type": "video/mp4", "content-length": "99" })
    );

    const response = await GET(
      request("http://localhost:3000/api/stream/vid1?type=video"),
      { params: Promise.resolve({ itemId: "vid1" }) }
    );

    expect(mockGetDirectStreamUrl).not.toHaveBeenCalled();
    expect(mockFetch.mock.calls[0][0]).toBe(
      "http://jellyfin:8096/Videos/vid1/stream?static=true"
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("video/mp4");
    expect(response.headers.get("Accept-Ranges")).toBe("bytes");
  });

  it("forwards Range requests and 206 responses for video seeking", async () => {
    mockFetch.mockResolvedValue(
      upstream(206, {
        "content-type": "video/mp4",
        "content-range": "bytes 0-1023/5000",
        "content-length": "1024",
      })
    );

    const response = await GET(
      request("http://localhost:3000/api/stream/vid1?type=video", {
        Range: "bytes=0-1023",
      }),
      { params: Promise.resolve({ itemId: "vid1" }) }
    );

    expect(mockFetch.mock.calls[0][1].headers.Range).toBe("bytes=0-1023");
    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Range")).toBe("bytes 0-1023/5000");
  });

  it("defaults the content type to video/mp4 when Jellyfin omits it", async () => {
    mockFetch.mockResolvedValue(upstream(200, {}));

    const response = await GET(
      request("http://localhost:3000/api/stream/vid1?type=video"),
      { params: Promise.resolve({ itemId: "vid1" }) }
    );

    expect(response.headers.get("Content-Type")).toBe("video/mp4");
  });

  it("reports video-specific upstream failures", async () => {
    mockFetch.mockResolvedValue(upstream(404, {}));

    const response = await GET(
      request("http://localhost:3000/api/stream/vid1?type=video"),
      { params: Promise.resolve({ itemId: "vid1" }) }
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Failed to fetch video stream",
    });
  });

  it("keeps using the audio stream URL without the video flag", async () => {
    mockGetDirectStreamUrl.mockResolvedValue("http://jellyfin:8096/Audio/x");
    mockFetch.mockResolvedValue(upstream(200, {}));

    const response = await GET(request("http://localhost:3000/api/stream/x"), {
      params: Promise.resolve({ itemId: "x" }),
    });

    expect(mockGetDirectStreamUrl).toHaveBeenCalledWith("x");
    expect(mockEnsureAuth).not.toHaveBeenCalled();
    expect(response.headers.get("Content-Type")).toBe("audio/mpeg");
  });
});
