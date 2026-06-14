import { fetchPlaylists, fetchArtists } from "@/services/searchFetchers";
import {
  PlaylistFetchContext,
  ArtistFetchContext,
  deduplicateById,
} from "./types";

export {
  executeFetchSongsByAlbum,
  executeFetchSongsByArtist,
  executeFetchSongsByPlaylist,
} from "./fetchSongs";

export async function executeFetchPlaylists(
  ctx: PlaylistFetchContext,
  page: number = 1,
  append: boolean = false
): Promise<void> {
  page === 1 ? ctx.setIsLoading(true) : ctx.setIsLoadingMore(true);
  if (page === 1) {
    ctx.setPlaylistResults([]);
    ctx.setHasSearched(true);
  }
  ctx.setError(null);
  try {
    const result = await fetchPlaylists(page);
    if (append && page > 1) {
      ctx.setPlaylistResults(prev =>
        deduplicateById([...prev, ...result.data])
      );
    } else {
      ctx.setPlaylistResults(result.data);
    }
    ctx.setHasMoreResults(result.hasMore);
    ctx.setCurrentPage(page);
  } catch (err) {
    ctx.setError(
      err instanceof Error ? err.message : "Failed to get playlists"
    );
    if (!append) ctx.setPlaylistResults([]);
  } finally {
    ctx.setIsLoading(false);
    ctx.setIsLoadingMore(false);
  }
}

export async function executeFetchArtists(
  ctx: ArtistFetchContext,
  page: number = 1,
  append: boolean = false
): Promise<void> {
  page === 1 ? ctx.setIsLoading(true) : ctx.setIsLoadingMore(true);
  if (page === 1 && !append) ctx.setArtistResults([]);
  ctx.setError(null);
  try {
    const result = await fetchArtists(page);
    if (append && page > 1) {
      ctx.setArtistResults(prev => deduplicateById([...prev, ...result.data]));
    } else {
      ctx.setArtistResults(result.data);
    }
    ctx.setHasMoreResults(result.hasMore);
    ctx.setCurrentPage(page);
  } catch (err) {
    ctx.setError(err instanceof Error ? err.message : "Failed to load artists");
    if (!append) ctx.setArtistResults([]);
  } finally {
    ctx.setIsLoading(false);
    ctx.setIsLoadingMore(false);
  }
}
