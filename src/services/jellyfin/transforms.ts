// Transform functions: Jellyfin API responses -> app domain types
import { MediaItem, Album, Artist } from "@/types";
import type { JellyfinMediaItem, JellyfinArtist, JellyfinAlbum } from "./types";

/**
 * Transform an array of Jellyfin media items to MediaItem format
 */
export function transformMediaItems(
  items: JellyfinMediaItem[],
  baseUrl: string
): MediaItem[] {
  return items
    .map(item => transformMediaItem(item, baseUrl))
    .filter(Boolean) as MediaItem[];
}

/**
 * Transform a single Jellyfin media item to MediaItem format
 */
export function transformMediaItem(
  item: JellyfinMediaItem,
  baseUrl: string
): MediaItem | null {
  if (item.Type !== "Audio") {
    return null;
  }

  const duration = item.RunTimeTicks
    ? Math.round(item.RunTimeTicks / 10000000)
    : 0;

  return {
    id: `jellyfin_${item.Id}`,
    title: item.Name || "Unknown Title",
    artist: item.Artists?.join(", ") || "Unknown Artist",
    album: item.Album,
    duration,
    jellyfinId: item.Id,
    streamUrl: `/api/stream/${item.Id}`,
    lyricsPath: detectLyricsPath(item),
    hasLyrics: item.HasLyrics || false,
  };
}

/**
 * Detect potential lyrics file path for a media item
 */
function detectLyricsPath(item: JellyfinMediaItem): string | undefined {
  return `jellyfin_${item.Id}`;
}

/**
 * Transform Jellyfin artists to Artist format
 */
export function transformArtists(
  items: JellyfinArtist[],
  baseUrl: string
): Artist[] {
  return items
    .filter(item => item.Type === "MusicArtist")
    .map(item => transformArtist(item, baseUrl))
    .filter(Boolean) as Artist[];
}

/**
 * Transform a single Jellyfin artist to Artist format
 */
function transformArtist(item: JellyfinArtist, baseUrl: string): Artist | null {
  if (item.Type !== "MusicArtist") {
    return null;
  }

  return {
    id: `jellyfin_artist_${item.Id}`,
    name: item.Name || "Unknown Artist",
    jellyfinId: item.Id,
    imageUrl: item.ImageTags?.Primary
      ? `${baseUrl}/Items/${item.Id}/Images/Primary?maxHeight=300&maxWidth=300&quality=90`
      : undefined,
  };
}

/**
 * Transform Jellyfin albums to Album format
 */
export function transformAlbums(
  items: JellyfinAlbum[],
  baseUrl: string
): Album[] {
  return items
    .filter(item => item.Type === "MusicAlbum")
    .map(item => transformAlbum(item, baseUrl))
    .filter(Boolean) as Album[];
}

/**
 * Transform a single Jellyfin album to Album format
 */
function transformAlbum(item: JellyfinAlbum, baseUrl: string): Album | null {
  if (item.Type !== "MusicAlbum") {
    return null;
  }

  return {
    id: `jellyfin_album_${item.Id}`,
    name: item.Name || "Unknown Album",
    artist: item.Artists?.join(", ") || "Unknown Artist",
    jellyfinId: item.Id,
    imageUrl: item.ImageTags?.Primary
      ? `${baseUrl}/Items/${item.Id}/Images/Primary?maxHeight=300&maxWidth=300&quality=90`
      : undefined,
    trackCount: item.ChildCount,
    year: item.ProductionYear,
    genre: item.Genres?.join(", "),
  };
}
