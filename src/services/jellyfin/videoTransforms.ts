// Transform Jellyfin video items (MusicVideo / Video / Movie) into MediaItems
import type { MediaItem } from "@/types";
import {
  classifyJellyfinItem,
  buildVideoProxyUrl,
  splitArtistTitle,
  VIDEO_ITEM_TYPES,
  DEFAULT_VIDEO_ITEM_TYPES,
} from "@/lib/mediaType";

export interface JellyfinVideoItem {
  Id?: string | null;
  Name?: string | null;
  Type?: string | null;
  MediaType?: string | null;
  Artists?: string[] | null;
  AlbumArtist?: string | null;
  Album?: string | null;
  RunTimeTicks?: number | null;
}

export interface VideoQueryOptions {
  searchTerm?: string;
  artistIds?: string;
  limit: number;
  startIndex: number;
}

/**
 * Build the /Items query for karaoke videos.
 * - No library configured: MusicVideo items anywhere (conservative).
 * - Library configured and resolved: every video type inside that library.
 * Videos never carry Jellyfin lyrics, so there is no HasLyrics filter.
 */
export function buildVideoQueryParams(
  options: VideoQueryOptions,
  userId: string,
  libraryId: string | null
): URLSearchParams {
  const types = libraryId ? VIDEO_ITEM_TYPES : DEFAULT_VIDEO_ITEM_TYPES;
  const params = new URLSearchParams({
    includeItemTypes: types.join(","),
    recursive: "true",
    limit: options.limit.toString(),
    startIndex: options.startIndex.toString(),
    userId,
    fields: "Artists,AlbumArtist,Album,RunTimeTicks",
    sortBy: "SortName",
    sortOrder: "Ascending",
  });
  if (libraryId) params.set("parentId", libraryId);
  if (options.searchTerm) params.set("searchTerm", options.searchTerm);
  if (options.artistIds) params.set("artistIds", options.artistIds);
  return params;
}

/**
 * Transform a single Jellyfin video item. Returns null for non-video items.
 * Artist/title fall back to parsing an "Artist - Title" file name when
 * Jellyfin has no artist metadata (typical for converted MP3+CDG files).
 */
export function transformVideoItem(item: JellyfinVideoItem): MediaItem | null {
  if (!item.Id || classifyJellyfinItem(item) !== "video") return null;

  const name = item.Name?.trim() || "Unknown Title";
  const taggedArtists = (item.Artists ?? []).filter(Boolean);
  const taggedArtist = taggedArtists.join(", ") || item.AlbumArtist || null;
  const parsed = taggedArtist ? null : splitArtistTitle(name);

  return {
    id: `jellyfin_${item.Id}`,
    title: parsed?.title ?? name,
    artist: taggedArtist ?? parsed?.artist ?? "Unknown Artist",
    album: item.Album || undefined,
    duration: item.RunTimeTicks ? Math.round(item.RunTimeTicks / 10000000) : 0,
    jellyfinId: item.Id,
    streamUrl: buildVideoProxyUrl(item.Id),
    hasLyrics: false,
    mediaType: "video",
  };
}

export function transformVideoItems(items: JellyfinVideoItem[]): MediaItem[] {
  return items
    .map(transformVideoItem)
    .filter((item): item is MediaItem => item !== null);
}
