// Album search and album song listing
import { MediaItem, Album } from "@/types";
import type {
  JellyfinContext,
  JellyfinAlbumSearchResponse,
  JellyfinSearchResponse,
} from "./types";
import { transformAlbums, transformMediaItems } from "./transforms";

/**
 * Search for albums by name
 */
export async function searchAlbums(
  ctx: JellyfinContext,
  query: string,
  limit: number = 50,
  startIndex: number = 0
): Promise<Album[]> {
  try {
    console.log(
      `Searching for albums: "${query}" (limit: ${limit}, startIndex: ${startIndex})`
    );

    const searchParams = new URLSearchParams({
      searchTerm: query,
      includeItemTypes: "MusicAlbum",
      recursive: "true",
      limit: limit.toString(),
      startIndex: startIndex.toString(),
      userId: ctx.userId,
      fields: "Artists,ProductionYear,Genres,ImageTags,ChildCount",
      sortBy: "SortName",
      sortOrder: "Ascending",
    });

    console.log(
      `Album search URL: ${ctx.baseUrl}/Items?${searchParams.toString()}`
    );

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
      throw new Error(`Album search failed: ${response.status}`);
    }

    const data: JellyfinAlbumSearchResponse = await response.json();
    console.log(`Jellyfin returned ${data.Items?.length || 0} albums`);

    const albums = transformAlbums(data.Items || [], ctx.baseUrl);
    console.log(`Transformed ${albums.length} albums`);

    return albums;
  } catch (error) {
    console.error("Jellyfin album search error:", error);
    throw error;
  }
}

/**
 * Get all songs by a specific album ID
 */
export async function getSongsByAlbumId(
  ctx: JellyfinContext,
  albumId: string,
  limit: number = 50,
  startIndex: number = 0
): Promise<MediaItem[]> {
  try {
    console.log(
      `Getting songs for album ID: ${albumId} (limit: ${limit}, startIndex: ${startIndex})`
    );

    const searchParams = new URLSearchParams({
      includeItemTypes: "Audio",
      recursive: "true",
      parentId: albumId,
      limit: limit.toString(),
      startIndex: startIndex.toString(),
      userId: ctx.userId,
      fields: "Artists,Album,RunTimeTicks",
      sortBy: "IndexNumber,SortName",
      sortOrder: "Ascending",
    });

    console.log(
      `Songs by album URL: ${ctx.baseUrl}/Items?${searchParams.toString()}`
    );

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
      throw new Error(`Get songs by album failed: ${response.status}`);
    }

    const data: JellyfinSearchResponse = await response.json();
    console.log(
      `Jellyfin returned ${data.Items?.length || 0} songs for album ${albumId}`
    );

    const songs = transformMediaItems(data.Items || [], ctx.baseUrl);
    console.log(`Transformed ${songs.length} songs`);

    return songs;
  } catch (error) {
    console.error("Jellyfin get songs by album error:", error);
    throw error;
  }
}
