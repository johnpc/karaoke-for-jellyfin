// Search functionality: media search, artist-based search, relevance sorting
import { MediaItem } from "@/types";
import type { JellyfinContext, JellyfinSearchResponse } from "./types";
import { transformMediaItems } from "./transforms";
import { fetchAllAudioItemsBatched } from "./batch";

/** Compute a relevance score for a media item (lower = more relevant) */
function getRelevanceScore(item: MediaItem, queryLower: string): number {
  const title = item.title.toLowerCase();
  const artist = item.artist.toLowerCase();

  if (title === queryLower) return 0;
  if (artist === queryLower) return 1;
  if (title.startsWith(queryLower)) return 2;
  if (artist.startsWith(queryLower)) return 3;
  return 4;
}

/**
 * Sort media items by relevance to the query (exact matches first)
 */
export function sortByRelevance(
  items: MediaItem[],
  query: string
): MediaItem[] {
  const queryLower = query.toLowerCase();
  return [...items].sort((a, b) => {
    const aScore = getRelevanceScore(a, queryLower);
    const bScore = getRelevanceScore(b, queryLower);

    if (aScore !== bScore) return aScore - bScore;
    return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
  });
}

/**
 * Sort media items by artist relevance to the query
 */
export function sortByArtistRelevance(
  items: MediaItem[],
  query: string
): MediaItem[] {
  const queryLower = query.toLowerCase();
  return [...items].sort((a, b) => {
    const aArtist = a.artist.toLowerCase();
    const bArtist = b.artist.toLowerCase();

    if (aArtist === queryLower && bArtist !== queryLower) return -1;
    if (bArtist === queryLower && aArtist !== queryLower) return 1;

    if (aArtist.startsWith(queryLower) && !bArtist.startsWith(queryLower))
      return -1;
    if (bArtist.startsWith(queryLower) && !aArtist.startsWith(queryLower))
      return 1;

    const artistCompare = aArtist.localeCompare(bArtist);
    if (artistCompare !== 0) return artistCompare;

    return a.title.localeCompare(b.title);
  });
}

/**
 * Perform a search against the Jellyfin API for a specific field
 */
export async function performSearch(
  ctx: JellyfinContext,
  query: string,
  limit: number,
  searchField: "Name" | "Artists"
): Promise<MediaItem[]> {
  try {
    const searchParams = new URLSearchParams({
      searchTerm: query,
      includeItemTypes: "Audio",
      recursive: "true",
      limit: (limit * 2).toString(),
      userId: ctx.userId,
      fields: "Artists,Album,RunTimeTicks",
    });

    console.log(`Performing ${searchField} search for: "${query}"`);

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
      throw new Error(`Search failed: ${response.status}`);
    }

    const data: JellyfinSearchResponse = await response.json();
    const items = transformMediaItems(data.Items || [], ctx.baseUrl);

    const queryLower = query.toLowerCase();
    const filtered = items.filter(item => {
      if (searchField === "Name") {
        return item.title.toLowerCase().includes(queryLower);
      } else if (searchField === "Artists") {
        return item.artist.toLowerCase().includes(queryLower);
      }
      return true;
    });

    console.log(
      `${searchField} search for "${query}": ${filtered.length} results`
    );
    return filtered;
  } catch (error) {
    console.error(`Jellyfin ${searchField} search error:`, error);
    return [];
  }
}

/**
 * Search by artist name with caching and pagination.
 * Fetches all items, filters by artist, caches results for 5 minutes.
 */
export async function searchByArtist(
  ctx: JellyfinContext,
  query: string,
  limit: number,
  startIndex: number,
  cache: Map<string, MediaItem[]>
): Promise<MediaItem[]> {
  const cacheKey = `artist_search_${query.toLowerCase()}`;
  let allMatchingItems: MediaItem[];

  if (cache.has(cacheKey)) {
    allMatchingItems = cache.get(cacheKey) || [];
  } else {
    const allItems = await fetchAllAudioItemsBatched(ctx);
    const queryLower = query.toLowerCase();
    allMatchingItems = allItems.filter(item =>
      item.artist.toLowerCase().includes(queryLower)
    );
    allMatchingItems = sortByArtistRelevance(allMatchingItems, query);

    cache.set(cacheKey, allMatchingItems);
    setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);
  }

  return allMatchingItems.slice(startIndex, startIndex + limit);
}
