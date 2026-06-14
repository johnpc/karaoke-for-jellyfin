// Artist search functionality
import { Artist } from "@/types";
import type { JellyfinContext, JellyfinArtistSearchResponse } from "./types";
import { transformArtists } from "./transforms";

/**
 * Search for artists by name
 */
export async function searchArtists(
  ctx: JellyfinContext,
  query: string,
  limit: number = 50,
  startIndex: number = 0
): Promise<Artist[]> {
  try {
    console.log(
      `Searching for artists: "${query}" (limit: ${limit}, startIndex: ${startIndex})`
    );

    const searchParams = new URLSearchParams({
      searchTerm: query,
      includeItemTypes: "MusicArtist",
      recursive: "true",
      limit: limit.toString(),
      startIndex: startIndex.toString(),
      userId: ctx.userId,
      fields: "Overview,ImageTags",
      sortBy: "SortName",
      sortOrder: "Ascending",
    });

    console.log(
      `Artist search URL: ${ctx.baseUrl}/Items?${searchParams.toString()}`
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
      throw new Error(`Artist search failed: ${response.status}`);
    }

    const data: JellyfinArtistSearchResponse = await response.json();
    console.log(`Jellyfin returned ${data.Items?.length || 0} artists`);

    const artists = transformArtists(data.Items || [], ctx.baseUrl);
    console.log(`Transformed ${artists.length} artists`);

    return artists;
  } catch (error) {
    console.error("Jellyfin artist search error:", error);
    throw error;
  }
}
