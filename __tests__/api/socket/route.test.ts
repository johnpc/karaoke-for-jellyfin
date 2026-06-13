import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/websocket", () => ({
  initializeWebSocket: vi.fn(),
}));

import { GET } from "@/app/api/socket/route";

function createRequest(
  url: string,
  headers?: Record<string, string>
): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    headers: new Headers(headers),
  });
}

describe("GET /api/socket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns websocket server info with ws protocol", async () => {
    const request = createRequest("http://localhost:3000/api/socket", {
      host: "localhost:3000",
      "x-forwarded-proto": "http",
    });
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe("WebSocket server is running");
    expect(json.websocketUrl).toBe("ws://localhost:3000");
    expect(json.endpoints).toBeDefined();
    expect(json.events).toBeDefined();
  });

  it("returns wss protocol when x-forwarded-proto is https", async () => {
    const request = createRequest("http://localhost:3000/api/socket", {
      host: "karaoke.example.com",
      "x-forwarded-proto": "https",
    });
    const response = await GET(request);
    const json = await response.json();

    expect(json.websocketUrl).toBe("wss://karaoke.example.com");
  });

  it("includes expected endpoint documentation", async () => {
    const request = createRequest("http://localhost:3000/api/socket", {
      host: "localhost:3000",
    });
    const response = await GET(request);
    const json = await response.json();

    expect(json.endpoints).toHaveProperty("join-session");
    expect(json.endpoints).toHaveProperty("add-song");
    expect(json.endpoints).toHaveProperty("remove-song");
    expect(json.endpoints).toHaveProperty("reorder-queue");
    expect(json.endpoints).toHaveProperty("playback-control");
    expect(json.endpoints).toHaveProperty("skip-song");
    expect(json.endpoints).toHaveProperty("user-heartbeat");
  });

  it("includes expected event documentation", async () => {
    const request = createRequest("http://localhost:3000/api/socket", {
      host: "localhost:3000",
    });
    const response = await GET(request);
    const json = await response.json();

    expect(json.events).toHaveProperty("session-updated");
    expect(json.events).toHaveProperty("queue-updated");
    expect(json.events).toHaveProperty("song-started");
    expect(json.events).toHaveProperty("song-ended");
    expect(json.events).toHaveProperty("user-joined");
    expect(json.events).toHaveProperty("user-left");
    expect(json.events).toHaveProperty("playback-state-changed");
    expect(json.events).toHaveProperty("lyrics-sync");
    expect(json.events).toHaveProperty("error");
  });
});
