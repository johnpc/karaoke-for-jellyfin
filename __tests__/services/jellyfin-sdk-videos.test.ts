import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MediaItem } from "@/types";

const mockSearchByTitle = vi.fn();
const mockGetSongsByArtistId = vi.fn();
const mockFetchVideoItems = vi.fn();

vi.mock("@/services/jellyfin-sdk/songs", () => ({
  searchByTitle: (...args: unknown[]) => mockSearchByTitle(...args),
  getSongsByArtistId: (...args: unknown[]) => mockGetSongsByArtistId(...args),
}));

vi.mock("@/services/jellyfin/videos", () => ({
  fetchVideoItems: (...args: unknown[]) => mockFetchVideoItems(...args),
}));

import {
  videoPageWindow,
  searchByTitleWithVideos,
  getSongsByArtistIdWithVideos,
} from "@/services/jellyfin-sdk/videos";

const ctx = { api: {}, baseUrl: "http://jf", apiKey: "k", userId: "u" } as any;

function song(id: string, overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: `jellyfin_${id}`,
    title: `Title ${id}`,
    artist: "Artist",
    duration: 100,
    jellyfinId: id,
    streamUrl: `/api/stream/${id}`,
    ...overrides,
  };
}

const video = (id: string, title = `Video ${id}`) =>
  song(id, {
    title,
    streamUrl: `/api/stream/${id}?type=video`,
    mediaType: "video",
  });

describe("videoPageWindow", () => {
  it("returns null while the page is filled with audio", () => {
    expect(videoPageWindow(50, 120, 50, 0)).toBeNull();
    expect(videoPageWindow(50, 120, 50, 50)).toBeNull();
  });

  it("starts videos at offset 0 on the page where audio runs out", () => {
    expect(videoPageWindow(20, 120, 50, 100)).toEqual({
      startIndex: 0,
      limit: 30,
    });
  });

  it("continues the video offset on later pages", () => {
    expect(videoPageWindow(0, 120, 50, 150)).toEqual({
      startIndex: 30,
      limit: 50,
    });
  });

  it("fills the whole first page with videos when there is no audio", () => {
    expect(videoPageWindow(0, 0, 50, 0)).toEqual({ startIndex: 0, limit: 50 });
  });
});

describe("searchByTitleWithVideos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns audio only when the audio page is full (audio path unchanged)", async () => {
    const audio = Array.from({ length: 3 }, (_, i) => song(`a${i}`));
    mockSearchByTitle.mockResolvedValue(audio);

    const result = await searchByTitleWithVideos(ctx, "take", 3, 0);

    expect(result).toEqual(audio);
    expect(mockSearchByTitle).toHaveBeenCalledWith(ctx, "take", 3, 0);
    expect(mockFetchVideoItems).not.toHaveBeenCalled();
  });

  it("appends Jellyfin's video matches after a short audio page", async () => {
    mockSearchByTitle.mockResolvedValue([song("a1", { title: "Take On Me" })]);
    mockFetchVideoItems.mockResolvedValue({
      items: [video("v1", "Take On Me (Karaoke)"), video("v2", "Take 2")],
      totalCount: 2,
    });

    const result = await searchByTitleWithVideos(ctx, "take", 10, 0);

    expect(mockFetchVideoItems).toHaveBeenCalledWith(ctx, {
      searchTerm: "take",
      startIndex: 0,
      limit: 9,
    });
    expect(result.map(i => i.jellyfinId)).toEqual(["a1", "v1", "v2"]);
    expect(result[1].mediaType).toBe("video");
  });

  it("returns the audio results when the video lookup fails", async () => {
    mockSearchByTitle.mockResolvedValue([song("a1")]);
    mockFetchVideoItems.mockRejectedValue(new Error("boom"));

    const result = await searchByTitleWithVideos(ctx, "x", 10, 0);

    expect(result).toEqual([song("a1")]);
    expect(console.error).toHaveBeenCalled();
  });
});

describe("getSongsByArtistIdWithVideos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("passes through when audio fills the page", async () => {
    const page = { songs: [song("a1"), song("a2")], totalCount: 10 };
    mockGetSongsByArtistId.mockResolvedValue(page);

    const result = await getSongsByArtistIdWithVideos(ctx, "art", 2, 0);

    expect(result).toEqual(page);
    expect(mockFetchVideoItems).not.toHaveBeenCalled();
  });

  it("appends the artist's videos once audio is exhausted and adds totals", async () => {
    mockGetSongsByArtistId.mockResolvedValue({
      songs: [song("a3")],
      totalCount: 3,
    });
    mockFetchVideoItems.mockResolvedValue({
      items: [video("v1")],
      totalCount: 4,
    });

    const result = await getSongsByArtistIdWithVideos(ctx, "art", 2, 2);

    expect(mockFetchVideoItems).toHaveBeenCalledWith(ctx, {
      artistIds: "art",
      startIndex: 0,
      limit: 1,
    });
    expect(result.songs.map(s => s.jellyfinId)).toEqual(["a3", "v1"]);
    expect(result.totalCount).toBe(7);
  });

  it("keeps the audio result when the video lookup fails", async () => {
    const page = { songs: [], totalCount: 0 };
    mockGetSongsByArtistId.mockResolvedValue(page);
    mockFetchVideoItems.mockRejectedValue(new Error("boom"));

    expect(await getSongsByArtistIdWithVideos(ctx, "art", 5, 0)).toEqual(page);
  });
});
