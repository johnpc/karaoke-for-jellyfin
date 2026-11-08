// Pure helpers for classifying Jellyfin items as audio vs. karaoke video
// and for building video stream URLs. No I/O here — see services/jellyfin/videos.
import type { MediaItem, MediaType } from "@/types";

/** Jellyfin item types that can hold a karaoke video with burned-in lyrics */
export const VIDEO_ITEM_TYPES = ["MusicVideo", "Video", "Movie"] as const;

/** Conservative default when no karaoke video library is configured */
export const DEFAULT_VIDEO_ITEM_TYPES = ["MusicVideo"] as const;

export interface JellyfinItemKind {
  Type?: string | null;
  MediaType?: string | null;
}

/**
 * Classify a Jellyfin item by how the TV should play it.
 * Returns null for items that are neither playable audio nor video
 * (artists, albums, playlists, folders, ...).
 */
export function classifyJellyfinItem(item: JellyfinItemKind): MediaType | null {
  if (item.Type === "Audio") return "audio";
  const isVideoType = (VIDEO_ITEM_TYPES as readonly string[]).includes(
    item.Type ?? ""
  );
  if (isVideoType || item.MediaType === "Video") return "video";
  return null;
}

/** True when a queue entry should be played as full-screen video */
export function isVideoMediaItem(
  item: Pick<MediaItem, "mediaType"> | null | undefined
): boolean {
  return item?.mediaType === "video";
}

/**
 * Jellyfin direct video stream (no transcoding). Used server-side by the
 * stream proxy, which authenticates with the Authorization header.
 */
export function buildVideoStreamUrl(baseUrl: string, itemId: string): string {
  const base = baseUrl.replace(/\/$/, "");
  return `${base}/Videos/${encodeURIComponent(itemId)}/stream?static=true`;
}

/** App-relative URL the TV's <video> element loads (proxied via /api/stream) */
export function buildVideoProxyUrl(itemId: string): string {
  return `/api/stream/${encodeURIComponent(itemId)}?type=video`;
}

/**
 * Karaoke MP4s converted from MP3+CDG are usually named "Artist - Title".
 * Jellyfin exposes that as the item Name with no Artists metadata, so split it.
 */
export function splitArtistTitle(name: string): {
  artist: string | null;
  title: string;
} {
  const match = name.match(/^(.+?)\s+-\s+(.+)$/);
  if (!match) return { artist: null, title: name.trim() };
  return { artist: match[1].trim(), title: match[2].trim() };
}
