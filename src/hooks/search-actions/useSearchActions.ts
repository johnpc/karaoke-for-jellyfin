"use client";

import { useCallback, useMemo } from "react";
import { Artist, Playlist, Album } from "@/types";
import { SearchStateSetters } from "@/hooks/useSearchState";
import {
  UnifiedSearchContext,
  SongFetchContext,
  PlaylistFetchContext,
  ArtistFetchContext,
} from "./types";
import { executeUnifiedSearch } from "./executeUnifiedSearch";
import {
  executeFetchSongsByAlbum,
  executeFetchSongsByArtist,
  executeFetchPlaylists,
  executeFetchSongsByPlaylist,
  executeFetchArtists,
} from "./executors";

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

  return useMemo(
    () => ({
      performUnifiedSearch,
      getSongsByAlbum,
      getSongsByArtist,
      getPlaylists,
      getSongsByPlaylist,
      loadMoreArtists,
    }),
    [
      performUnifiedSearch,
      getSongsByAlbum,
      getSongsByArtist,
      getPlaylists,
      getSongsByPlaylist,
      loadMoreArtists,
    ]
  );
}
