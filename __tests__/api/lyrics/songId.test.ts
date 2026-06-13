import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetLyrics = vi.fn();
const mockUpdateSyncState = vi.fn();

vi.mock("@/services/lyrics", () => ({
  getLyricsService: () => ({
    getLyrics: mockGetLyrics,
    updateSyncState: mockUpdateSyncState,
  }),
}));

import { GET, POST } from "@/app/api/lyrics/[songId]/route";

function createRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), options);
}

describe("GET /api/lyrics/[songId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns lyrics for a valid song ID", async () => {
    const mockLyricsFile = {
      lines: [
        { time: 0, text: "First line" },
        { time: 5, text: "Second line" },
      ],
      format: "lrc",
    };
    mockGetLyrics.mockResolvedValue(mockLyricsFile);

    const request = createRequest("http://localhost:3000/api/lyrics/song123");
    const response = await GET(request, {
      params: Promise.resolve({ songId: "song123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockLyricsFile);
  });

  it("returns sync state when time param is provided", async () => {
    const mockLyricsFile = { lines: [], format: "lrc" };
    const mockSyncState = {
      currentLine: 2,
      currentText: "Hello world",
      progress: 0.5,
    };
    mockGetLyrics.mockResolvedValue(mockLyricsFile);
    mockUpdateSyncState.mockReturnValue(mockSyncState);

    const request = createRequest(
      "http://localhost:3000/api/lyrics/song123?time=10.5"
    );
    const response = await GET(request, {
      params: Promise.resolve({ songId: "song123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockSyncState);
    expect(mockUpdateSyncState).toHaveBeenCalledWith("song123", 10.5);
  });

  it("returns 404 when sync state cannot be determined", async () => {
    const mockLyricsFile = { lines: [], format: "lrc" };
    mockGetLyrics.mockResolvedValue(mockLyricsFile);
    mockUpdateSyncState.mockReturnValue(null);

    const request = createRequest(
      "http://localhost:3000/api/lyrics/song123?time=999"
    );
    const response = await GET(request, {
      params: Promise.resolve({ songId: "song123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("SYNC_FAILED");
  });

  it("returns 404 when lyrics are not found", async () => {
    mockGetLyrics.mockResolvedValue(null);

    const request = createRequest("http://localhost:3000/api/lyrics/unknown");
    const response = await GET(request, {
      params: Promise.resolve({ songId: "unknown" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("LYRICS_NOT_FOUND");
  });

  it("returns 500 on unexpected error", async () => {
    mockGetLyrics.mockRejectedValue(new Error("File system error"));

    const request = createRequest("http://localhost:3000/api/lyrics/song123");
    const response = await GET(request, {
      params: Promise.resolve({ songId: "song123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("POST /api/lyrics/[songId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates sync state with provided time", async () => {
    const mockSyncState = {
      currentLine: 3,
      currentText: "Some lyrics",
      progress: 0.75,
    };
    mockUpdateSyncState.mockReturnValue(mockSyncState);

    const request = createRequest("http://localhost:3000/api/lyrics/song123", {
      method: "POST",
      body: JSON.stringify({ currentTime: 25.5 }),
    });
    const response = await POST(request, {
      params: Promise.resolve({ songId: "song123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockSyncState);
    expect(mockUpdateSyncState).toHaveBeenCalledWith("song123", 25.5);
  });

  it("returns 400 when currentTime is missing", async () => {
    const request = createRequest("http://localhost:3000/api/lyrics/song123", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(request, {
      params: Promise.resolve({ songId: "song123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_REQUEST");
  });

  it("returns 400 when currentTime is not a number", async () => {
    const request = createRequest("http://localhost:3000/api/lyrics/song123", {
      method: "POST",
      body: JSON.stringify({ currentTime: "not-a-number" }),
    });
    const response = await POST(request, {
      params: Promise.resolve({ songId: "song123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_REQUEST");
  });

  it("returns 404 when lyrics are not loaded for song", async () => {
    mockUpdateSyncState.mockReturnValue(null);

    const request = createRequest("http://localhost:3000/api/lyrics/song123", {
      method: "POST",
      body: JSON.stringify({ currentTime: 10 }),
    });
    const response = await POST(request, {
      params: Promise.resolve({ songId: "song123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("LYRICS_NOT_FOUND");
  });

  it("returns 500 on unexpected error", async () => {
    mockUpdateSyncState.mockImplementation(() => {
      throw new Error("Internal error");
    });

    const request = createRequest("http://localhost:3000/api/lyrics/song123", {
      method: "POST",
      body: JSON.stringify({ currentTime: 10 }),
    });
    const response = await POST(request, {
      params: Promise.resolve({ songId: "song123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INTERNAL_ERROR");
  });
});
