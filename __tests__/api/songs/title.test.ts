import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockHealthCheck = vi.fn();
const mockSearchByTitle = vi.fn();

vi.mock("@/services/jellyfin-sdk", () => ({
  getJellyfinSDKService: () => ({
    healthCheck: mockHealthCheck,
    searchByTitle: mockSearchByTitle,
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

import { GET } from "@/app/api/songs/title/route";

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("GET /api/songs/title", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHealthCheck.mockResolvedValue(true);
  });

  it("returns songs matching title query", async () => {
    const mockSongs = [{ id: "1", title: "Yesterday", artist: "The Beatles" }];
    mockSearchByTitle.mockResolvedValue(mockSongs);

    const request = createRequest(
      "http://localhost:3000/api/songs/title?q=yesterday&limit=10"
    );
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockSongs);
    expect(json.pagination).toBeDefined();
    expect(mockSearchByTitle).toHaveBeenCalledWith("yesterday", 10, 0);
  });

  it("returns 400 when query is missing", async () => {
    const request = createRequest("http://localhost:3000/api/songs/title");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_SEARCH");
    expect(json.error.message).toBe("Search query is required");
  });

  it("returns 400 when query is empty", async () => {
    const request = createRequest("http://localhost:3000/api/songs/title?q=");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_SEARCH");
  });

  it("returns 503 when jellyfin is unavailable", async () => {
    mockHealthCheck.mockResolvedValue(false);

    const request = createRequest(
      "http://localhost:3000/api/songs/title?q=test"
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
      throw new ValidationError("Query too long");
    });

    const request = createRequest("http://localhost:3000/api/songs/title?q=x");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_SEARCH");
  });

  it("returns 500 on unexpected error", async () => {
    const { validateSearchRequest } = await import("@/lib/validation");
    vi.mocked(validateSearchRequest).mockImplementation(() => undefined);
    mockHealthCheck.mockRejectedValue(new Error("Network error"));

    const request = createRequest(
      "http://localhost:3000/api/songs/title?q=test"
    );
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("TITLE_SEARCH_FAILED");
  });
});
