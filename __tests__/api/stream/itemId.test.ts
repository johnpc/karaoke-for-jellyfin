import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetDirectStreamUrl = vi.fn();

vi.mock("@/services/jellyfin", () => ({
  getJellyfinService: () => ({
    getDirectStreamUrl: mockGetDirectStreamUrl,
  }),
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { GET, OPTIONS } from "@/app/api/stream/[itemId]/route";

function createRequest(
  url: string,
  headers?: Record<string, string>
): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    headers: headers ? new Headers(headers) : undefined,
  });
}

describe("GET /api/stream/[itemId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JELLYFIN_API_KEY = "test-api-key";
  });

  it("returns audio stream for valid item ID", async () => {
    mockGetDirectStreamUrl.mockResolvedValue(
      "http://jellyfin:8096/stream/item123"
    );

    const audioData = new ArrayBuffer(1024);
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        "content-type": "audio/flac",
        "content-length": "1024",
      }),
      body: new ReadableStream(),
      bodyUsed: false,
      arrayBuffer: () => Promise.resolve(audioData),
    });

    const request = createRequest("http://localhost:3000/api/stream/item123");
    const response = await GET(request, {
      params: Promise.resolve({ itemId: "item123" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("audio/flac");
    expect(response.headers.get("Content-Length")).toBe("1024");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=3600");
  });

  it("returns 400 when itemId is missing", async () => {
    const request = createRequest("http://localhost:3000/api/stream/");
    const response = await GET(request, {
      params: Promise.resolve({ itemId: "" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Item ID is required");
  });

  it("returns error status when jellyfin stream fails", async () => {
    mockGetDirectStreamUrl.mockResolvedValue(
      "http://jellyfin:8096/stream/item123"
    );
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers(),
      text: () => Promise.resolve("Not found"),
    });

    const request = createRequest("http://localhost:3000/api/stream/item123");
    const response = await GET(request, {
      params: Promise.resolve({ itemId: "item123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Failed to fetch audio stream");
  });

  it("returns 500 on unexpected error", async () => {
    mockGetDirectStreamUrl.mockRejectedValue(new Error("Connection refused"));

    const request = createRequest("http://localhost:3000/api/stream/item123");
    const response = await GET(request, {
      params: Promise.resolve({ itemId: "item123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Internal server error");
  });

  it("returns 502 when response body is null", async () => {
    mockGetDirectStreamUrl.mockResolvedValue(
      "http://jellyfin:8096/stream/item123"
    );
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "audio/mpeg" }),
      body: null,
      bodyUsed: false,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    });

    const request = createRequest("http://localhost:3000/api/stream/item123");
    const response = await GET(request, {
      params: Promise.resolve({ itemId: "item123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(502);
    expect(json.error).toBe("No audio data received from Jellyfin");
  });
});

describe("OPTIONS /api/stream/[itemId]", () => {
  it("returns CORS headers", async () => {
    const response = await OPTIONS();

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET, HEAD, OPTIONS"
    );
    expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
      "Range, Content-Range, Content-Length"
    );
  });
});
