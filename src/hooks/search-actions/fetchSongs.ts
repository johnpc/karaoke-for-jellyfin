import { Artist, Album, Playlist } from "@/types";
import {
  fetchSongsByAlbum,
  fetchSongsByArtist,
  fetchSongsByPlaylist,
} from "@/services/searchFetchers";
import { SongFetchContext, deduplicateById } from "./types";

export async function executeFetchSongsByAlbum(
  ctx: SongFetchContext,
  album: Album,
  page: number = 1,
  append: boolean = false
): Promise<void> {
  page === 1 ? ctx.setIsLoading(true) : ctx.setIsLoadingMore(true);
  if (page === 1) ctx.setSongResults([]);
  ctx.setError(null);
  try {
    const result = await fetchSongsByAlbum(album.id, page);
    if (append && page > 1) {
      ctx.setSongResults(prev => deduplicateById([...prev, ...result.data]));
    } else {
      ctx.setSongResults(result.data);
    }
    ctx.setHasMoreResults(result.hasMore);
    ctx.setCurrentPage(page);
  } catch (err) {
    ctx.setError(
      err instanceof Error ? err.message : "Failed to get songs by album"
    );
    if (!append) ctx.setSongResults([]);
  } finally {
    ctx.setIsLoading(false);
    ctx.setIsLoadingMore(false);
  }
}

export async function executeFetchSongsByArtist(
  ctx: SongFetchContext,
  artist: Artist,
  page: number = 1,
  append: boolean = false
): Promise<void> {
  page === 1 ? ctx.setIsLoading(true) : ctx.setIsLoadingMore(true);
  if (page === 1) ctx.setSongResults([]);
  ctx.setError(null);
  try {
    const result = await fetchSongsByArtist(artist.id, page);
    if (append && page > 1) {
      ctx.setSongResults(prev => deduplicateById([...prev, ...result.data]));
    } else {
      ctx.setSongResults(result.data);
    }
    ctx.setHasMoreResults(result.hasMore);
    ctx.setCurrentPage(page);
  } catch (err) {
    ctx.setError(
      err instanceof Error ? err.message : "Failed to get songs by artist"
    );
    if (!append) ctx.setSongResults([]);
  } finally {
    ctx.setIsLoading(false);
    ctx.setIsLoadingMore(false);
  }
}

export async function executeFetchSongsByPlaylist(
  ctx: SongFetchContext,
  playlist: Playlist,
  page: number = 1,
  append: boolean = false
): Promise<void> {
  page === 1 ? ctx.setIsLoading(true) : ctx.setIsLoadingMore(true);
  if (page === 1) ctx.setSongResults([]);
  ctx.setError(null);
  try {
    const result = await fetchSongsByPlaylist(playlist.id, page);
    if (append && page > 1) {
      ctx.setSongResults(prev => deduplicateById([...prev, ...result.data]));
    } else {
      ctx.setSongResults(result.data);
    }
    ctx.setHasMoreResults(result.hasMore);
    ctx.setCurrentPage(page);
  } catch (err) {
    ctx.setError(
      err instanceof Error ? err.message : "Failed to get songs by playlist"
    );
    if (!append) ctx.setSongResults([]);
  } finally {
    ctx.setIsLoading(false);
    ctx.setIsLoadingMore(false);
  }
}
