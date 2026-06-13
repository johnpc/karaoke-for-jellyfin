import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockHealthCheck = vi.fn();
const mockSearchArtists = vi.fn();
const mockGetAllArtists = vi.fn();

vi.mock("@/services/jellyfin-sdk", () => ({
  getJellyfinSDKService: () => ({
    healthCheck: mockHealthCheck,
    searchArtists: mockSearchArtists,
    getAllArtists: mockGetAllArtists,
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

import { GET } from "@/app/api/artists/route";

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("GET /api/artists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHealthCheck.mockResolvedValue(true);
  });

  it("returns all artists when no query is provided", async () => {
    const mockArtists = [
      { id: "1", name: "Queen" },
      { id: "2", name: "The Beatles" },
    ];
    mockGetAllArtists.mockResolvedValue(mockArtists);

    const request = createRequest("http://localhost:3000/api/artists");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockArtists);
    expect(json.pagination).toBeDefined();
    expect(mockGetAllArtists).toHaveBeenCalledWith(50, 0);
  });

  it("searches artists when query is provided", async () => {
    const mockArtists = [{ id: "1", name: "Queen" }];
    mockSearchArtists.mockResolvedValue(mockArtists);

    const request = createRequest(
      "http://localhost:3000/api/artists?q=queen&limit=10"
    );
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockArtists);
    expect(mockSearchArtists).toHaveBeenCalledWith("queen", 10, 0);
  });

  it("returns 503 when jellyfin is unavailable", async () => {
    mockHealthCheck.mockResolvedValue(false);

    const request = createRequest("http://localhost:3000/api/artists");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("JELLYFIN_UNAVAILABLE");
  });

  it("returns 400 for invalid search query", async () => {
    const { validateSearchRequest } = await import("@/lib/validation");
    const { ValidationError } = await import("@/lib/validation");
    vi.mocked(validateSearchRequest).mockImplementation(() => {
      throw new ValidationError("Query too short");
    });

    const request = createRequest("http://localhost:3000/api/artists?q=x");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_SEARCH");
  });

  it("returns 500 on unexpected error", async () => {
    mockHealthCheck.mockRejectedValue(new Error("Unexpected"));

    const request = createRequest("http://localhost:3000/api/artists");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("ARTIST_REQUEST_FAILED");
  });
});
