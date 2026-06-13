import { describe, it, expect, vi, beforeEach } from "vitest";

const mockHealthCheck = vi.fn();
const mockGetLibraries = vi.fn();

vi.mock("@/services/jellyfin", () => ({
  getJellyfinService: () => ({
    healthCheck: mockHealthCheck,
    getLibraries: mockGetLibraries,
    userId: "test-user-id",
  }),
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { GET } from "@/app/api/debug/route";

describe("GET /api/debug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JELLYFIN_SERVER_URL = "http://jellyfin:8096";
    process.env.JELLYFIN_API_KEY = "test-api-key";
  });

  it("returns debug info when jellyfin is healthy", async () => {
    mockHealthCheck.mockResolvedValue(true);
    mockGetLibraries.mockResolvedValue([
      { Name: "Music", Id: "lib1", CollectionType: "music" },
      { Name: "Movies", Id: "lib2", CollectionType: "movies" },
    ]);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          Items: [{ Name: "Test Song", Type: "Audio", MediaType: "Audio" }],
        }),
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.healthy).toBe(true);
    expect(json.libraries).toHaveLength(2);
    expect(json.libraries[0]).toEqual({
      name: "Music",
      id: "lib1",
      type: "music",
    });
    expect(json.sampleItems).toHaveLength(1);
    expect(json.sampleItems[0]).toEqual({
      name: "Test Song",
      type: "Audio",
      mediaType: "Audio",
    });
    expect(json.userId).toBe("test-user-id");
  });

  it("returns 503 when jellyfin is unavailable", async () => {
    mockHealthCheck.mockResolvedValue(false);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.error).toBe("Jellyfin server is not accessible");
  });

  it("handles empty items response", async () => {
    mockHealthCheck.mockResolvedValue(true);
    mockGetLibraries.mockResolvedValue([]);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ Items: [] }),
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.healthy).toBe(true);
    expect(json.libraries).toEqual([]);
    expect(json.sampleItems).toEqual([]);
  });

  it("handles failed items fetch gracefully", async () => {
    mockHealthCheck.mockResolvedValue(true);
    mockGetLibraries.mockResolvedValue([]);
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.healthy).toBe(true);
    expect(json.sampleItems).toEqual([]);
  });

  it("returns 500 on unexpected error", async () => {
    mockHealthCheck.mockRejectedValue(new Error("Connection refused"));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Debug check failed");
    expect(json.details).toBe("Connection refused");
  });
});
