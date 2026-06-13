import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockHealthCheck = vi.fn();
const mockSearchByArtist = vi.fn();

vi.mock("@/services/jellyfin", () => ({
  getJellyfinService: () => ({
    healthCheck: mockHealthCheck,
    searchByArtist: mockSearchByArtist,
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

import { GET } from "@/app/api/songs/artist/route";

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("GET /api/songs/artist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHealthCheck.mockResolvedValue(true);
  });

  it("returns songs matching artist query", async () => {
    const mockSongs = [{ id: "1", title: "Imagine", artist: "John Lennon" }];
    mockSearchByArtist.mockResolvedValue(mockSongs);

    const request = createRequest(
      "http://localhost:3000/api/songs/artist?q=lennon&limit=20"
    );
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockSongs);
    expect(json.pagination).toBeDefined();
    expect(mockSearchByArtist).toHaveBeenCalledWith("lennon", 20, 0);
  });

  it("returns 400 when query is missing", async () => {
    const request = createRequest("http://localhost:3000/api/songs/artist");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_SEARCH");
    expect(json.error.message).toBe("Search query is required");
  });

  it("returns 400 when query is empty whitespace", async () => {
    const request = createRequest(
      "http://localhost:3000/api/songs/artist?q=%20%20"
    );
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_SEARCH");
  });

  it("returns 503 when jellyfin is unavailable", async () => {
    mockHealthCheck.mockResolvedValue(false);

    const request = createRequest(
      "http://localhost:3000/api/songs/artist?q=queen"
    );
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("JELLYFIN_UNAVAILABLE");
  });

  it("returns 400 for invalid search params", async () => {
    const { validateSearchRequest } = await import("@/lib/validation");
    const { ValidationError } = await import("@/lib/validation");
    vi.mocked(validateSearchRequest).mockImplementation(() => {
      throw new ValidationError("Invalid limit");
    });

    const request = createRequest("http://localhost:3000/api/songs/artist?q=x");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_SEARCH");
  });

  it("returns 500 on unexpected error", async () => {
    const { validateSearchRequest } = await import("@/lib/validation");
    vi.mocked(validateSearchRequest).mockImplementation(() => undefined);
    mockHealthCheck.mockRejectedValue(new Error("Service down"));

    const request = createRequest(
      "http://localhost:3000/api/songs/artist?q=test"
    );
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("ARTIST_SEARCH_FAILED");
  });
});
