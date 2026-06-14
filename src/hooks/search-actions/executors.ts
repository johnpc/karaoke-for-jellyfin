import { Artist, Album, Playlist } from "@/types";
import {
  fetchSongsByAlbum,
  fetchSongsByArtist,
  fetchPlaylists,
  fetchSongsByPlaylist,
  fetchArtists,
} from "@/services/searchFetchers";
import {
  SongFetchContext,
  PlaylistFetchContext,
  ArtistFetchContext,
  deduplicateById,
} from "./types";

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
    const msg =
      err instanceof Error ? err.message : "Failed to get songs by album";
    ctx.setError(msg);
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
    const msg =
      err instanceof Error ? err.message : "Failed to get songs by artist";
    ctx.setError(msg);
    if (!append) ctx.setSongResults([]);
  } finally {
    ctx.setIsLoading(false);
    ctx.setIsLoadingMore(false);
  }
}

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
    const msg = err instanceof Error ? err.message : "Failed to get playlists";
    ctx.setError(msg);
    if (!append) ctx.setPlaylistResults([]);
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
    const msg =
      err instanceof Error ? err.message : "Failed to get songs by playlist";
    ctx.setError(msg);
    if (!append) ctx.setSongResults([]);
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
    const msg = err instanceof Error ? err.message : "Failed to load artists";
    ctx.setError(msg);
    if (!append) ctx.setArtistResults([]);
  } finally {
    ctx.setIsLoading(false);
    ctx.setIsLoadingMore(false);
  }
}
