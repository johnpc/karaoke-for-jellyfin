import { MediaItem } from "@/types";
import { JellyfinContext, SongResult } from "./types";
import { transformMediaItems } from "./transformers";

export async function getSongsByArtistId(
  ctx: JellyfinContext,
  artistId: string,
  limit: number,
  startIndex: number
): Promise<SongResult> {
  console.log(
    `Getting songs for artist ID: ${artistId} (limit: ${limit}, startIndex: ${startIndex})`
  );

  const params = new URLSearchParams({
    includeItemTypes: "Audio",
    recursive: "true",
    artistIds: artistId,
    limit: limit.toString(),
    startIndex: startIndex.toString(),
    userId: ctx.userId,
    fields: "Artists,Album,RunTimeTicks,HasLyrics",
    sortBy: "SortName",
    sortOrder: "Ascending",
    filters: "HasLyrics",
  });

  const itemsUrl = `${ctx.baseUrl}/Items?${params}`;
  const response = await fetch(itemsUrl, {
    method: "GET",
    headers: {
      "X-Emby-Token": ctx.apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  const totalCount = data.TotalRecordCount || 0;
  console.log(
    `Jellyfin returned ${data.Items?.length || 0} songs for artist ${artistId} (total: ${totalCount})`
  );

  if (startIndex === 0) {
    console.log(`Artist query URL: ${itemsUrl}`);
  }

  const songs = transformMediaItems(data.Items || []);

  return { songs, totalCount };
}

export async function searchByTitle(
  ctx: JellyfinContext,
  query: string,
  limit: number,
  startIndex: number
): Promise<MediaItem[]> {
  console.log(
    `Searching by title: "${query}" (limit: ${limit}, startIndex: ${startIndex})`
  );

  const params = new URLSearchParams({
    searchTerm: query,
    includeItemTypes: "Audio",
    recursive: "true",
    limit: limit.toString(),
    startIndex: startIndex.toString(),
    userId: ctx.userId,
    fields: "Artists,Album,RunTimeTicks,HasLyrics",
    filters: "HasLyrics",
  });

  const itemsUrl = `${ctx.baseUrl}/Items?${params}`;
  const response = await fetch(itemsUrl, {
    method: "GET",
    headers: {
      "X-Emby-Token": ctx.apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  console.log(
    `Jellyfin returned ${data.Items?.length || 0} items for title search`
  );

  const items = transformMediaItems(data.Items || []);

  const queryLower = query.toLowerCase();
  const filtered = items.filter(item =>
    item.title.toLowerCase().includes(queryLower)
  );

  console.log(`After title filtering: ${filtered.length} items`);
  return filtered;
}

/**
 * Get all audio items from Jellyfin library (for browsing)
 */
export async function getAllAudioItems(
  ctx: JellyfinContext,
  startIndex: number,
  limit: number
): Promise<MediaItem[]> {
  const params = new URLSearchParams({
    includeItemTypes: "Audio",
    recursive: "true",
    startIndex: startIndex.toString(),
    limit: limit.toString(),
    userId: ctx.userId,
    fields: "Artists,Album,RunTimeTicks,HasLyrics",
    sortBy: "SortName",
    sortOrder: "Ascending",
    filters: "HasLyrics",
  });

  const itemsUrl = `${ctx.baseUrl}/Items?${params}`;
  const response = await fetch(itemsUrl, {
    method: "GET",
    headers: {
      "X-Emby-Token": ctx.apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  console.log(
    `Jellyfin audio items: ${data.Items?.length || 0} of ${data.TotalRecordCount}`
  );

  const transformedItems = transformMediaItems(data.Items);
  console.log(`Transformed items count: ${transformedItems.length}`);
  return transformedItems;
}
