import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetServerConfig = vi.fn();

vi.mock("@/lib/config", () => ({
  getServerConfig: () => mockGetServerConfig(),
}));

import { GET } from "@/app/api/config/route";

describe("GET /api/config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns server configuration", async () => {
    const mockConfig = {
      autoplayDelay: 500,
      queueAutoplayDelay: 1000,
      controlsAutoHideDelay: 10000,
      timeUpdateInterval: 2000,
      ratingAnimationDuration: 15000,
      nextSongDuration: 15000,
    };
    mockGetServerConfig.mockReturnValue(mockConfig);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(mockConfig);
  });

  it("returns 500 when config retrieval fails", async () => {
    mockGetServerConfig.mockImplementation(() => {
      throw new Error("Config error");
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Failed to get configuration");
  });
});
