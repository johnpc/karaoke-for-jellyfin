// Playlist-related Jellyfin SDK calls
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { MediaItem, Playlist } from "@/types";
import { JellyfinContext } from "./types";
import { transformMediaItems, transformPlaylists } from "./transformers";

/**
 * Get all music playlists from Jellyfin
 */
export async function getPlaylists(
  ctx: JellyfinContext,
  limit: number,
  startIndex: number
): Promise<Playlist[]> {
  console.log(`Getting playlists (limit: ${limit}, startIndex: ${startIndex})`);

  const params = new URLSearchParams({
    includeItemTypes: "Playlist",
    recursive: "true",
    limit: limit.toString(),
    startIndex: startIndex.toString(),
    userId: ctx.userId,
    fields: "Overview,ChildCount,DateCreated",
    sortBy: "SortName",
    sortOrder: "Ascending",
  });

  const playlistsUrl = `${ctx.baseUrl}/Items?${params}`;
  const response = await fetch(playlistsUrl, {
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
  console.log(`Jellyfin returned ${data.Items?.length || 0} playlists`);

  const playlists = transformPlaylists(data.Items || [], ctx.baseUrl);
  console.log(`Transformed ${playlists.length} playlists`);

  return playlists;
}

/**
 * Get songs from a specific playlist, filtered to audio items with lyrics
 */
export async function getPlaylistItems(
  ctx: JellyfinContext,
  playlistId: string,
  limit: number,
  startIndex: number
): Promise<MediaItem[]> {
  console.log(
    `Getting playlist items for playlist ID: ${playlistId} (limit: ${limit}, startIndex: ${startIndex})`
  );

  const params = new URLSearchParams({
    limit: limit.toString(),
    startIndex: startIndex.toString(),
    userId: ctx.userId,
    fields: "Artists,Album,RunTimeTicks,HasLyrics",
    filters: "HasLyrics",
  });

  const playlistItemsUrl = `${ctx.baseUrl}/Playlists/${playlistId}/Items?${params}`;
  const response = await fetch(playlistItemsUrl, {
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
    `Jellyfin returned ${data.Items?.length || 0} items for playlist ${playlistId}`
  );

  const audioItems = (data.Items || []).filter(
    (item: BaseItemDto) => item.Type === "Audio"
  );
  const songs = transformMediaItems(audioItems);
  console.log(`Transformed ${songs.length} songs from playlist`);

  return songs;
}
