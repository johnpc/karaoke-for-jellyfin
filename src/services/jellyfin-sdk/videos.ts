// Append karaoke videos to the audio results used by the mobile UI
import type { MediaItem } from "@/types";
import type { JellyfinContext, SongResult } from "./types";
import { searchByTitle, getSongsByArtistId } from "./songs";
import { fetchVideoItems } from "@/services/jellyfin/videos";

export interface PageWindow {
  startIndex: number;
  limit: number;
}

/**
 * Videos are paged as a virtual list that starts where the audio list ends,
 * so the audio pagination stays exactly as before and videos fill the
 * remaining slots of the page once audio is exhausted.
 */
export function videoPageWindow(
  audioCount: number,
  audioTotal: number,
  limit: number,
  startIndex: number
): PageWindow | null {
  const remaining = limit - audioCount;
  if (remaining <= 0) return null;
  return {
    startIndex: Math.max(0, startIndex + audioCount - audioTotal),
    limit: remaining,
  };
}

export async function searchByTitleWithVideos(
  ctx: JellyfinContext,
  query: string,
  limit: number,
  startIndex: number
): Promise<MediaItem[]> {
  const audio = await searchByTitle(ctx, query, limit, startIndex);
  // Title search has no exact audio total (results are filtered client-side),
  // so assume audio ends on the first short page. Videos appear from there.
  const window = videoPageWindow(
    audio.length,
    startIndex + audio.length,
    limit,
    startIndex
  );
  if (!window) return audio;

  try {
    // Jellyfin's searchTerm already scopes the match; no second title filter,
    // otherwise a small window could be emptied and hide videos entirely.
    const { items } = await fetchVideoItems(ctx, {
      searchTerm: query,
      ...window,
    });
    return [...audio, ...items];
  } catch (error) {
    console.error("Karaoke video search failed:", error);
    return audio;
  }
}

export async function getSongsByArtistIdWithVideos(
  ctx: JellyfinContext,
  artistId: string,
  limit: number,
  startIndex: number
): Promise<SongResult> {
  const result = await getSongsByArtistId(ctx, artistId, limit, startIndex);
  const window = videoPageWindow(
    result.songs.length,
    result.totalCount,
    limit,
    startIndex
  );
  if (!window) return result;

  try {
    const videos = await fetchVideoItems(ctx, {
      artistIds: artistId,
      ...window,
    });
    return {
      songs: [...result.songs, ...videos.items],
      totalCount: result.totalCount + videos.totalCount,
    };
  } catch (error) {
    console.error("Karaoke video lookup by artist failed:", error);
    return result;
  }
}
