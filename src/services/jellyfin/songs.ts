// Song/track fetching: by artist ID, all audio items, metadata
import { MediaItem } from "@/types";
import type {
  JellyfinContext,
  JellyfinMediaItem,
  JellyfinSearchResponse,
} from "./types";
import { transformMediaItems, transformMediaItem } from "./transforms";

/**
 * Get all songs by a specific artist ID
 */
export async function getSongsByArtistId(
  ctx: JellyfinContext,
  artistId: string,
  limit: number = 50,
  startIndex: number = 0
): Promise<MediaItem[]> {
  try {
    const searchParams = new URLSearchParams({
      includeItemTypes: "Audio",
      recursive: "true",
      artistIds: artistId,
      limit: limit.toString(),
      startIndex: startIndex.toString(),
      userId: ctx.userId,
      fields: "Artists,Album,RunTimeTicks",
      sortBy: "Album,SortName",
      sortOrder: "Ascending",
    });

    const response = await fetch(
      `${ctx.baseUrl}/Items?${searchParams.toString()}`,
      {
        headers: {
          "X-Emby-Token": ctx.apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Get songs by artist failed: ${response.status}`);
    }

    const data: JellyfinSearchResponse = await response.json();
    return transformMediaItems(data.Items || [], ctx.baseUrl);
  } catch (error) {
    console.error("Jellyfin get songs by artist error:", error);
    throw error;
  }
}

/**
 * Get all audio items from Jellyfin library (for browsing)
 */
export async function getAllAudioItems(
  ctx: JellyfinContext,
  startIndex: number = 0,
  limit: number = 100
): Promise<MediaItem[]> {
  try {
    const searchParams = new URLSearchParams({
      includeItemTypes: "Audio",
      recursive: "true",
      startIndex: startIndex.toString(),
      limit: limit.toString(),
      userId: ctx.userId,
      fields: "Artists,Album,RunTimeTicks",
      sortBy: "SortName",
      sortOrder: "Ascending",
    });

    const url = `${ctx.baseUrl}/Items?${searchParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        "X-Emby-Token": ctx.apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch audio items: ${response.status}`);
    }

    const data: JellyfinSearchResponse = await response.json();
    return transformMediaItems(data.Items, ctx.baseUrl);
  } catch (error) {
    console.error("Jellyfin get audio items error:", error);
    throw error;
  }
}

/**
 * Get detailed metadata for a specific item
 */
export async function getMediaMetadata(
  ctx: JellyfinContext,
  itemId: string
): Promise<MediaItem | null> {
  try {
    const response = await fetch(
      `${ctx.baseUrl}/Items/${itemId}?userId=${ctx.userId}&fields=Artists,Album,RunTimeTicks`,
      {
        headers: {
          "X-Emby-Token": ctx.apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get metadata: ${response.status}`);
    }

    const item: JellyfinMediaItem = await response.json();
    return transformMediaItem(item, ctx.baseUrl);
  } catch (error) {
    console.error("Jellyfin get metadata error:", error);
    return null;
  }
}
