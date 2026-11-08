import { describe, it, expect, vi } from "vitest";
import { createPlaylistSongFetcher } from "../../server/autoplay-playlist-fetch";

const JELLYFIN_URL = "http://jellyfin.local:8096/";
const APP_URL = "http://localhost:3000";
const API_KEY = "test-api-key";

const jellyfinPlaylists = {
  Items: [
    { Id: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", Name: "Kids Karaoke" },
    { Id: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", Name: "Party Mix" },
  ],
};

const appItems = {
  success: true,
  data: [
    { id: "jellyfin_s1", title: "Let It Go", streamUrl: "/api/stream/s1" },
    { id: "jellyfin_s2", title: "Under the Sea", streamUrl: "/api/stream/s2" },
  ],
};

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body };
}

// Mock Jellyfin + app API: routes by URL
function mockFetch(
  overrides: Partial<Record<"playlists" | "items", unknown>> = {}
) {
  return vi.fn(async (url: string) => {
    if (url.startsWith(`${JELLYFIN_URL.replace(/\/+$/, "")}/Items`)) {
      return overrides.playlists ?? jsonResponse(jellyfinPlaylists);
    }
    if (url.startsWith(`${APP_URL}/api/playlists/`)) {
      return overrides.items ?? jsonResponse(appItems);
    }
    throw new Error(`unexpected url ${url}`);
  });
}

function makeFetcher(
  fetchImpl = mockFetch(),
  env: Partial<{
    jellyfinUrl: string;
    apiKey: string;
  }> = {}
) {
  return createPlaylistSongFetcher({
    appBaseUrl: APP_URL,
    jellyfinUrl: env.jellyfinUrl ?? JELLYFIN_URL,
    apiKey: env.apiKey ?? API_KEY,
    fetchImpl: fetchImpl as unknown as typeof fetch,
  });
}

describe("createPlaylistSongFetcher", () => {
  it("resolves a playlist by name and loads its songs via the app API", async () => {
    const fetchImpl = mockFetch();
    const result = await makeFetcher(fetchImpl)("kids karaoke");

    expect(result.playlist).toEqual({
      id: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      name: "Kids Karaoke",
    });
    expect(result.songs.map((s: { title: string }) => s.title)).toEqual([
      "Let It Go",
      "Under the Sea",
    ]);

    // Jellyfin lookup authenticates with the modern Authorization header
    // (header, not query string; X-Emby-Token is rejected by Jellyfin 12+)
    const [jellyfinUrl, jellyfinOptions] = fetchImpl.mock.calls[0];
    expect(jellyfinUrl).toContain("/Items?");
    expect(jellyfinUrl).toContain("IncludeItemTypes=Playlist");
    expect(jellyfinUrl).not.toContain(API_KEY);
    expect(jellyfinOptions).toEqual({
      headers: { Authorization: `MediaBrowser Token="${API_KEY}"` },
    });

    // Songs come from the app route so they match phone-queued items
    expect(fetchImpl.mock.calls[1][0]).toBe(
      `${APP_URL}/api/playlists/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/items?limit=1000`
    );
  });

  it("resolves a playlist by Jellyfin id", async () => {
    const result = await makeFetcher()("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
    expect(result.playlist.name).toBe("Party Mix");
  });

  it("falls through to the items route for an id missing from the listing", async () => {
    const fetchImpl = mockFetch();
    const id = "cccccccccccccccccccccccccccccccc";
    const result = await makeFetcher(fetchImpl)(id);

    expect(result.playlist).toEqual({ id, name: id });
    expect(fetchImpl.mock.calls[1][0]).toContain(`/api/playlists/${id}/items`);
  });

  it("lists available playlists when the name is unknown", async () => {
    await expect(makeFetcher()("Nope")).rejects.toThrow(
      /playlist "Nope" not found.*"Kids Karaoke".*"Party Mix"/
    );
  });

  it("fails fast when Jellyfin credentials are missing", async () => {
    const fetchImpl = mockFetch();
    await expect(
      makeFetcher(fetchImpl, { apiKey: "" })("Kids Karaoke")
    ).rejects.toThrow(/JELLYFIN_SERVER_URL and JELLYFIN_API_KEY/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("surfaces HTTP errors from Jellyfin", async () => {
    const fetchImpl = mockFetch({
      playlists: jsonResponse({}, false, 401),
    });
    await expect(makeFetcher(fetchImpl)("Kids Karaoke")).rejects.toThrow(
      /HTTP 401/
    );
  });

  it("surfaces HTTP errors from the app items route", async () => {
    const fetchImpl = mockFetch({ items: jsonResponse({}, false, 503) });
    await expect(makeFetcher(fetchImpl)("Kids Karaoke")).rejects.toThrow(
      /HTTP 503/
    );
  });

  it("returns an empty song list when the route has no data", async () => {
    const fetchImpl = mockFetch({ items: jsonResponse({ success: true }) });
    const result = await makeFetcher(fetchImpl)("Kids Karaoke");
    expect(result.songs).toEqual([]);
  });
});
