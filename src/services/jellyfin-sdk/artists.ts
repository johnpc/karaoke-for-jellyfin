// Artist-related Jellyfin SDK calls
import { Artist } from "@/types";
import { JellyfinContext } from "./types";
import { transformArtists } from "./transformers";

/**
 * Search for artists by name
 */
export async function searchArtists(
  ctx: JellyfinContext,
  query: string,
  limit: number,
  startIndex: number,
  musicLibraryId: string | null
): Promise<Artist[]> {
  console.log(
    `Searching for artists: "${query}" (limit: ${limit}, startIndex: ${startIndex})`
  );

  const params = new URLSearchParams({
    searchTerm: query,
    startIndex: startIndex.toString(),
    limit: limit.toString(),
    userId: ctx.userId,
    fields: "Overview,ImageTags",
    recursive: "true",
  });

  if (musicLibraryId) {
    params.set("parentId", musicLibraryId);
  }

  const artistsUrl = `${ctx.baseUrl}/Artists?${params}`;
  const response = await fetch(artistsUrl, {
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
  console.log(`Jellyfin returned ${data.Items?.length || 0} artists`);

  const artists = transformArtists(data.Items || [], ctx.baseUrl);
  console.log(`Transformed ${artists.length} artists`);

  return artists;
}

/**
 * Get all artists (without search query), sorted alphabetically
 */
export async function getAllArtists(
  ctx: JellyfinContext,
  limit: number,
  startIndex: number,
  musicLibraryId: string | null
): Promise<Artist[]> {
  console.log(
    `Getting all artists (limit: ${limit}, startIndex: ${startIndex})`
  );

  const params = new URLSearchParams({
    startIndex: startIndex.toString(),
    limit: limit.toString(),
    userId: ctx.userId,
    fields: "Overview,ImageTags",
    recursive: "true",
    sortBy: "SortName",
    sortOrder: "Ascending",
  });

  if (musicLibraryId) {
    params.set("parentId", musicLibraryId);
  }

  const artistsUrl = `${ctx.baseUrl}/Artists?${params}`;
  const response = await fetch(artistsUrl, {
    method: "GET",
    headers: {
      "X-Emby-Token": ctx.apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log(`Jellyfin returned ${data.Items?.length || 0} artists`);

  const artists = transformArtists(data.Items || [], ctx.baseUrl);
  console.log(`Transformed ${artists.length} artists`);

  return artists;
}
