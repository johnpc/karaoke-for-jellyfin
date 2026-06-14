// Batch fetching of all audio items from Jellyfin
import { MediaItem } from "@/types";
import type { JellyfinContext, JellyfinSearchResponse } from "./types";
import { transformMediaItems } from "./transforms";

const BATCH_SIZE = 1000;
const MAX_ITEMS = 50000;

/**
 * Fetch all audio items from the library in batches.
 * Used by artist-based search to filter client-side.
 */
export async function fetchAllAudioItemsBatched(
  ctx: JellyfinContext
): Promise<MediaItem[]> {
  let currentStartIndex = 0;
  let hasMoreItems = true;
  const allItems: MediaItem[] = [];

  while (hasMoreItems) {
    const searchParams = new URLSearchParams({
      includeItemTypes: "Audio",
      recursive: "true",
      limit: BATCH_SIZE.toString(),
      startIndex: currentStartIndex.toString(),
      userId: ctx.userId,
      fields: "Artists,Album,RunTimeTicks",
      sortBy: "SortName",
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
      throw new Error(`Batch fetch failed: ${response.status}`);
    }

    const data: JellyfinSearchResponse = await response.json();
    const batchItems = transformMediaItems(data.Items || [], ctx.baseUrl);
    allItems.push(...batchItems);

    hasMoreItems = batchItems.length === BATCH_SIZE;
    currentStartIndex += BATCH_SIZE;

    if (currentStartIndex > MAX_ITEMS) {
      console.warn("Reached maximum fetch limit of 50,000 items");
      break;
    }
  }

  return allItems;
}
