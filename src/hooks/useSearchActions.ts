"use client";

import { useCallback } from "react";
import { MediaItem, Artist, Playlist, Album } from "@/types";
import * as SearchService from "@/services/searchService";
import {
  fetchSongsByAlbum,
  fetchSongsByArtist,
  fetchPlaylists,
  fetchSongsByPlaylist,
  fetchArtists,
} from "@/services/searchFetchers";
import { SearchStateSetters } from "@/hooks/useSearchState";

function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  return items.filter(
    (item, index, arr) => arr.findIndex(i => i.id === item.id) === index
  );
}

// --- Standalone action functions (each has low complexity) ---

interface FetchContext {
  setIsLoading: (v: boolean) => void;
  setIsLoadingMore: (v: boolean) => void;
  setError: (v: string | null) => void;
  setHasMoreResults: (v: boolean) => void;
  setCurrentPage: (v: number) => void;
}

interface UnifiedSearchContext extends FetchContext {
  setSongResults: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  setArtistResults: React.Dispatch<React.SetStateAction<Artist[]>>;
  setAlbumResults: React.Dispatch<React.SetStateAction<Album[]>>;
  setHasSearched: (v: boolean) => void;
}

function clearUnifiedResults(ctx: UnifiedSearchContext): void {
  ctx.setSongResults([]);
  ctx.setArtistResults([]);
  ctx.setAlbumResults([]);
  ctx.setHasSearched(false);
  ctx.setHasMoreResults(true);
  ctx.setCurrentPage(1);
}

function applyUnifiedResults(
  ctx: UnifiedSearchContext,
  results: {
    artists: Artist[];
    albums: Album[];
    songs: MediaItem[];
    hasMore: boolean;
    error?: string;
  },
  append: boolean,
  page: number
): void {
  if (append && page > 1) {
    ctx.setArtistResults(prev =>
      SearchService.mergeUniqueResults(prev, results.artists)
    );
    ctx.setAlbumResults(prev =>
      SearchService.mergeUniqueResults(prev, results.albums)
    );
    ctx.setSongResults(prev =>
      SearchService.mergeUniqueResults(prev, results.songs)
    );
  } else {
    ctx.setArtistResults(results.artists);
    ctx.setAlbumResults(results.albums);
    ctx.setSongResults(results.songs);
  }
  ctx.setHasMoreResults(results.hasMore);
  ctx.setCurrentPage(page);
  if (results.error) {
    ctx.setError(results.error);
  }
}

export async function executeUnifiedSearch(
  ctx: UnifiedSearchContext,
  query: string,
  page: number = 1,
  append: boolean = false
): Promise<void> {
  if (!query.trim()) {
    clearUnifiedResults(ctx);
    return;
  }

  if (page === 1) {
    ctx.setIsLoading(true);
    if (!append) {
      ctx.setSongResults([]);
      ctx.setArtistResults([]);
      ctx.setAlbumResults([]);
    }
  } else {
    ctx.setIsLoadingMore(true);
  }

  ctx.setError(null);
  ctx.setHasSearched(true);

  try {
    const results = await SearchService.performUnifiedSearch({ query, page });
    applyUnifiedResults(ctx, results, append, page);
  } catch (err) {
    console.error("Unified search wrapper error:", err);
    ctx.setError("Failed to connect to server");
    if (!append) {
      ctx.setSongResults([]);
      ctx.setArtistResults([]);
      ctx.setAlbumResults([]);
    }
  } finally {
    ctx.setIsLoading(false);
    ctx.setIsLoadingMore(false);
  }
}

interface SongFetchContext extends FetchContext {
  setSongResults: React.Dispatch<React.SetStateAction<MediaItem[]>>;
}

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

interface PlaylistFetchContext extends FetchContext {
  setPlaylistResults: React.Dispatch<React.SetStateAction<Playlist[]>>;
  setHasSearched: (v: boolean) => void;
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

interface ArtistFetchContext extends FetchContext {
  setArtistResults: React.Dispatch<React.SetStateAction<Artist[]>>;
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

// --- Hook that wraps standalone functions in useCallback ---

export interface UseSearchActionsReturn {
  performUnifiedSearch: (
    query: string,
    page?: number,
    append?: boolean
  ) => Promise<void>;
  getSongsByAlbum: (
    album: Album,
    page?: number,
    append?: boolean
  ) => Promise<void>;
  getSongsByArtist: (
    artist: Artist,
    page?: number,
    append?: boolean
  ) => Promise<void>;
  getPlaylists: (page?: number, append?: boolean) => Promise<void>;
  getSongsByPlaylist: (
    playlist: Playlist,
    page?: number,
    append?: boolean
  ) => Promise<void>;
  loadMoreArtists: (page?: number, append?: boolean) => Promise<void>;
}

export function useSearchActions(
  setters: SearchStateSetters
): UseSearchActionsReturn {
  const unifiedCtx: UnifiedSearchContext = {
    setIsLoading: setters.setIsLoading,
    setIsLoadingMore: setters.setIsLoadingMore,
    setError: setters.setError,
    setHasMoreResults: setters.setHasMoreResults,
    setCurrentPage: setters.setCurrentPage,
    setSongResults: setters.setSongResults,
    setArtistResults: setters.setArtistResults,
    setAlbumResults: setters.setAlbumResults,
    setHasSearched: setters.setHasSearched,
  };

  const songCtx: SongFetchContext = {
    setIsLoading: setters.setIsLoading,
    setIsLoadingMore: setters.setIsLoadingMore,
    setError: setters.setError,
    setHasMoreResults: setters.setHasMoreResults,
    setCurrentPage: setters.setCurrentPage,
    setSongResults: setters.setSongResults,
  };

  const playlistCtx: PlaylistFetchContext = {
    setIsLoading: setters.setIsLoading,
    setIsLoadingMore: setters.setIsLoadingMore,
    setError: setters.setError,
    setHasMoreResults: setters.setHasMoreResults,
    setCurrentPage: setters.setCurrentPage,
    setPlaylistResults: setters.setPlaylistResults,
    setHasSearched: setters.setHasSearched,
  };

  const artistCtx: ArtistFetchContext = {
    setIsLoading: setters.setIsLoading,
    setIsLoadingMore: setters.setIsLoadingMore,
    setError: setters.setError,
    setHasMoreResults: setters.setHasMoreResults,
    setCurrentPage: setters.setCurrentPage,
    setArtistResults: setters.setArtistResults,
  };

  const performUnifiedSearch = useCallback(
    (query: string, page: number = 1, append: boolean = false) =>
      executeUnifiedSearch(unifiedCtx, query, page, append),
    // Setters from useState are stable references
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const getSongsByAlbum = useCallback(
    (album: Album, page: number = 1, append: boolean = false) =>
      executeFetchSongsByAlbum(songCtx, album, page, append),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const getSongsByArtist = useCallback(
    (artist: Artist, page: number = 1, append: boolean = false) =>
      executeFetchSongsByArtist(songCtx, artist, page, append),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const getPlaylists = useCallback(
    (page: number = 1, append: boolean = false) =>
      executeFetchPlaylists(playlistCtx, page, append),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const getSongsByPlaylist = useCallback(
    (playlist: Playlist, page: number = 1, append: boolean = false) =>
      executeFetchSongsByPlaylist(songCtx, playlist, page, append),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const loadMoreArtists = useCallback(
    (page: number = 1, append: boolean = false) =>
      executeFetchArtists(artistCtx, page, append),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return {
    performUnifiedSearch,
    getSongsByAlbum,
    getSongsByArtist,
    getPlaylists,
    getSongsByPlaylist,
    loadMoreArtists,
  };
}
