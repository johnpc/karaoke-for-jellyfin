import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getKaraokeVideoLibrarySetting,
  findLibraryId,
  resolveVideoLibraryId,
  resetVideoLibraryCache,
  fetchVideoItems,
} from "@/services/jellyfin/videos";
import {
  buildVideoQueryParams,
  transformVideoItem,
  transformVideoItems,
} from "@/services/jellyfin/videoTransforms";

const ctx = { baseUrl: "http://jf:8096", apiKey: "key", userId: "user1" };
const mockFetch = vi.fn();

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, statusText: "x", json: async () => body } as Response;
}

const folders = [
  { Name: "Music", CollectionType: "music", ItemId: "music-id" },
  { Name: "Karaoke Videos", CollectionType: "homevideos", ItemId: "kv-id" },
];

describe("karaoke video library setting", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.KARAOKE_VIDEO_LIBRARY;
    resetVideoLibraryCache();
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("is null when unset or blank", () => {
    expect(getKaraokeVideoLibrarySetting()).toBeNull();
    process.env.KARAOKE_VIDEO_LIBRARY = "   ";
    expect(getKaraokeVideoLibrarySetting()).toBeNull();
  });

  it("returns the trimmed value when set", () => {
    process.env.KARAOKE_VIDEO_LIBRARY = " Karaoke Videos ";
    expect(getKaraokeVideoLibrarySetting()).toBe("Karaoke Videos");
  });

  it("findLibraryId matches by id, then by name, case-insensitively", () => {
    expect(findLibraryId(folders, "KV-ID")).toBe("kv-id");
    expect(findLibraryId(folders, "karaoke videos")).toBe("kv-id");
    expect(findLibraryId(folders, "Movies")).toBeNull();
  });

  it("resolveVideoLibraryId skips the network when unset", async () => {
    expect(await resolveVideoLibraryId(ctx)).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("resolves by name via /Library/VirtualFolders and caches", async () => {
    process.env.KARAOKE_VIDEO_LIBRARY = "Karaoke Videos";
    mockFetch.mockResolvedValue(jsonResponse(folders));

    expect(await resolveVideoLibraryId(ctx)).toBe("kv-id");
    expect(await resolveVideoLibraryId(ctx)).toBe("kv-id");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe(
      "http://jf:8096/Library/VirtualFolders"
    );
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toContain(
      'Token="key"'
    );
  });

  it("warns and falls back to null (MusicVideo only) when not found", async () => {
    process.env.KARAOKE_VIDEO_LIBRARY = "Nope";
    mockFetch.mockResolvedValue(jsonResponse(folders));

    expect(await resolveVideoLibraryId(ctx)).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('KARAOKE_VIDEO_LIBRARY "Nope" not found')
    );
    // cached as "not found" - no second request
    expect(await resolveVideoLibraryId(ctx)).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("does not cache transient failures", async () => {
    process.env.KARAOKE_VIDEO_LIBRARY = "Karaoke Videos";
    mockFetch
      .mockResolvedValueOnce(jsonResponse(null, false, 500))
      .mockResolvedValueOnce(jsonResponse(folders));

    expect(await resolveVideoLibraryId(ctx)).toBeNull();
    expect(await resolveVideoLibraryId(ctx)).toBe("kv-id");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("fetchVideoItems queries MusicVideo only when no library is set", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        TotalRecordCount: 1,
        Items: [
          {
            Id: "mv1",
            Name: "Take On Me",
            Type: "MusicVideo",
            Artists: ["a-ha"],
            RunTimeTicks: 2250000000,
          },
        ],
      })
    );

    const result = await fetchVideoItems(ctx, {
      searchTerm: "take",
      limit: 10,
      startIndex: 0,
    });

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toBe("/Items");
    expect(url.searchParams.get("includeItemTypes")).toBe("MusicVideo");
    expect(url.searchParams.get("parentId")).toBeNull();
    expect(url.searchParams.get("searchTerm")).toBe("take");
    expect(url.searchParams.get("filters")).toBeNull();
    expect(url.searchParams.get("userId")).toBe("user1");
    expect(result.totalCount).toBe(1);
    expect(result.items[0]).toMatchObject({
      jellyfinId: "mv1",
      title: "Take On Me",
      artist: "a-ha",
      duration: 225,
      mediaType: "video",
    });
  });

  it("fetchVideoItems widens to all video types inside the configured library", async () => {
    process.env.KARAOKE_VIDEO_LIBRARY = "kv-id";
    mockFetch
      .mockResolvedValueOnce(jsonResponse(folders))
      .mockResolvedValueOnce(jsonResponse({ TotalRecordCount: 0, Items: [] }));

    await fetchVideoItems(ctx, { artistIds: "art1", limit: 5, startIndex: 5 });

    const url = new URL(mockFetch.mock.calls[1][0]);
    expect(url.searchParams.get("includeItemTypes")).toBe(
      "MusicVideo,Video,Movie"
    );
    expect(url.searchParams.get("parentId")).toBe("kv-id");
    expect(url.searchParams.get("artistIds")).toBe("art1");
    expect(url.searchParams.get("limit")).toBe("5");
    expect(url.searchParams.get("startIndex")).toBe("5");
  });

  it("fetchVideoItems throws on HTTP errors", async () => {
    mockFetch.mockResolvedValue(jsonResponse(null, false, 503));
    await expect(
      fetchVideoItems(ctx, { limit: 1, startIndex: 0 })
    ).rejects.toThrow("Video search failed: HTTP 503");
  });
});

describe("buildVideoQueryParams", () => {
  it("omits optional filters that are not provided", () => {
    const params = buildVideoQueryParams(
      { limit: 50, startIndex: 0 },
      "u",
      null
    );
    expect(params.get("searchTerm")).toBeNull();
    expect(params.get("artistIds")).toBeNull();
    expect(params.get("recursive")).toBe("true");
    expect(params.get("fields")).toContain("RunTimeTicks");
  });
});

describe("transformVideoItem", () => {
  it("uses Jellyfin artist metadata when present", () => {
    expect(
      transformVideoItem({
        Id: "v1",
        Name: "Song",
        Type: "MusicVideo",
        Artists: ["A", "B"],
        Album: "Hits",
        RunTimeTicks: 10000000,
      })
    ).toEqual({
      id: "jellyfin_v1",
      title: "Song",
      artist: "A, B",
      album: "Hits",
      duration: 1,
      jellyfinId: "v1",
      streamUrl: "/api/stream/v1?type=video",
      hasLyrics: false,
      mediaType: "video",
    });
  });

  it("falls back to AlbumArtist without splitting the name", () => {
    const item = transformVideoItem({
      Id: "v2",
      Name: "Queen - Bohemian Rhapsody",
      Type: "Video",
      AlbumArtist: "Queen",
    });
    expect(item?.artist).toBe("Queen");
    expect(item?.title).toBe("Queen - Bohemian Rhapsody");
  });

  it("parses 'Artist - Title' file names for untagged videos", () => {
    const item = transformVideoItem({
      Id: "v3",
      Name: "Queen - Bohemian Rhapsody",
      Type: "Movie",
      Artists: [],
    });
    expect(item).toMatchObject({
      title: "Bohemian Rhapsody",
      artist: "Queen",
      duration: 0,
      album: undefined,
    });
    expect(item?.lyricsPath).toBeUndefined();
  });

  it("uses Unknown Artist / Unknown Title when nothing is available", () => {
    expect(
      transformVideoItem({ Id: "v4", Name: "  ", Type: "Video" })
    ).toMatchObject({ title: "Unknown Title", artist: "Unknown Artist" });
  });

  it("returns null for non-video items or missing ids", () => {
    expect(transformVideoItem({ Id: "a1", Type: "Audio" })).toBeNull();
    expect(transformVideoItem({ Name: "x", Type: "Video" })).toBeNull();
  });

  it("transformVideoItems drops nulls", () => {
    expect(
      transformVideoItems([
        { Id: "a1", Type: "Audio" },
        { Id: "v1", Name: "X - Y", Type: "MusicVideo" },
      ])
    ).toHaveLength(1);
  });
});
