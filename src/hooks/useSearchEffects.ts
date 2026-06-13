"use client";

import { useEffect, useCallback } from "react";
import { MediaItem, Artist, Album, Playlist } from "@/types";
import { fetchArtists } from "@/services/searchFetchers";
import {
  SearchState,
  SearchStateSetters,
  SearchTab,
} from "@/hooks/useSearchState";
import { UseSearchActionsReturn } from "@/hooks/useSearchActions";

// --- Standalone handler functions ---

function buildConfirmationSuccess(song: MediaItem): string {
  const truncatedTitle =
    song.title.length > 40 ? `${song.title.substring(0, 40)}...` : song.title;
  return `"${truncatedTitle}" by ${song.artist} added to queue!`;
}

function buildConfirmationError(err: unknown): string {
  const errorMessage =
    err instanceof Error ? err.message : "Failed to add song to queue";
  if (errorMessage.includes("join a session first")) {
    return "You must join a session first. Please refresh the page and try again.";
  }
  return errorMessage;
}

export type LoadMoreDispatcher = (
  state: SearchState,
  actions: UseSearchActionsReturn
) => Promise<void>;

/** Determines which fetch to call based on current view state. */
export async function dispatchLoadMore(
  state: SearchState,
  actions: UseSearchActionsReturn
): Promise<void> {
  const nextPage = state.currentPage + 1;

  if (state.activeTab === "search") {
    return dispatchSearchTabLoadMore(state, actions, nextPage);
  }
  if (state.activeTab === "playlist") {
    return dispatchPlaylistTabLoadMore(state, actions, nextPage);
  }
}

async function dispatchSearchTabLoadMore(
  state: SearchState,
  actions: UseSearchActionsReturn,
  nextPage: number
): Promise<void> {
  if (state.artistViewMode === "artists") {
    if (state.searchQuery.trim()) {
      await actions.performUnifiedSearch(state.searchQuery, nextPage, true);
    } else {
      await actions.loadMoreArtists(nextPage, true);
    }
    return;
  }
  if (state.selectedArtist) {
    await actions.getSongsByArtist(state.selectedArtist, nextPage, true);
    return;
  }
  if (state.selectedAlbum) {
    await actions.getSongsByAlbum(state.selectedAlbum, nextPage, true);
  }
}

async function dispatchPlaylistTabLoadMore(
  state: SearchState,
  actions: UseSearchActionsReturn,
  nextPage: number
): Promise<void> {
  if (state.playlistViewMode === "playlists") {
    await actions.getPlaylists(nextPage, true);
    return;
  }
  if (state.selectedPlaylist) {
    await actions.getSongsByPlaylist(state.selectedPlaylist, nextPage, true);
  }
}

// --- Hook ---

export interface UseSearchEffectsReturn {
  handleLoadMore: () => void;
  handleAddSong: (song: MediaItem) => void;
  handleTabChange: (tab: SearchTab) => void;
  handleAlbumSelect: (album: Album) => void;
  handleArtistSelect: (artist: Artist) => void;
  handlePlaylistSelect: (playlist: Playlist) => void;
  handleBackToArtists: () => void;
  handleBackToAlbums: () => void;
  handleBackToPlaylists: () => void;
  handleCloseConfirmation: () => void;
  handleSearchInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearchSubmit: (e: React.FormEvent) => void;
}

export function useSearchEffects(
  state: SearchState,
  setters: SearchStateSetters,
  actions: UseSearchActionsReturn,
  onAddSong: (mediaItem: MediaItem) => Promise<void>,
  isConnected: boolean
): UseSearchEffectsReturn {
  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (state.activeTab === "search" && state.artistViewMode === "artists") {
        actions.performUnifiedSearch(state.searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [state.searchQuery, state.activeTab, state.artistViewMode, actions]);

  // Load all artists on initial load
  useEffect(() => {
    const loadInitialArtists = async () => {
      setters.setIsLoading(true);
      setters.setHasSearched(true);
      try {
        const result = await fetchArtists(1);
        setters.setArtistResults(result.data);
        setters.setHasMoreResults(result.hasMore);
        setters.setCurrentPage(1);
      } catch (err) {
        console.error("Failed to load initial artists:", err);
        const msg =
          err instanceof Error ? err.message : "Failed to connect to server";
        setters.setError(msg);
      } finally {
        setters.setIsLoading(false);
      }
    };

    if (
      !state.hasSearched &&
      state.activeTab === "search" &&
      state.artistViewMode === "artists"
    ) {
      loadInitialArtists();
    }
  }, [state.hasSearched, state.activeTab, state.artistViewMode]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!state.hasMoreResults || state.isLoadingMore || state.isLoading) return;
    dispatchLoadMore(state, actions);
  }, [state, actions]);

  // Handle adding a song
  const handleAddSong = useCallback(
    async (song: MediaItem) => {
      if (!isConnected) {
        setters.setError("Not connected to server");
        return;
      }

      setters.setAddingSongId(song.id);

      try {
        await onAddSong(song);
        setters.setConfirmationMessage(buildConfirmationSuccess(song));
        setters.setConfirmationType("success");
        setters.setShowConfirmation(true);
        setters.setError(null);
      } catch (err) {
        const errorMessage = buildConfirmationError(err);
        setters.setConfirmationMessage(errorMessage);
        setters.setConfirmationType("error");
        setters.setShowConfirmation(true);
        setters.setError(
          err instanceof Error ? err.message : "Failed to add song to queue"
        );
      } finally {
        setters.setAddingSongId(null);
      }
    },
    [isConnected, onAddSong, setters]
  );

  // Tab change resets everything
  const handleTabChange = useCallback(
    (tab: SearchTab) => {
      setters.setActiveTab(tab);
      setters.setSearchQuery("");
      setters.setSongResults([]);
      setters.setArtistResults([]);
      setters.setAlbumResults([]);
      setters.setPlaylistResults([]);
      setters.setHasSearched(false);
      setters.setError(null);
      setters.setHasMoreResults(true);
      setters.setCurrentPage(1);
      setters.setArtistViewMode("artists");
      setters.setPlaylistViewMode("playlists");
      setters.setSelectedArtist(null);
      setters.setSelectedPlaylist(null);
      setters.setSelectedAlbum(null);
      setters.setIsArtistSectionCollapsed(false);
      setters.setIsSongSectionCollapsed(false);
      setters.setIsAlbumSectionCollapsed(false);

      if (tab === "playlist") {
        actions.getPlaylists();
      }
    },
    [setters, actions]
  );

  // Navigation handlers
  const handleAlbumSelect = useCallback(
    async (album: Album) => {
      setters.setSelectedAlbum(album);
      setters.setArtistViewMode("songs");
      setters.setCurrentPage(1);
      setters.setHasMoreResults(true);
      await actions.getSongsByAlbum(album);
    },
    [setters, actions]
  );

  const handleArtistSelect = useCallback(
    async (artist: Artist) => {
      setters.setSelectedArtist(artist);
      setters.setArtistViewMode("songs");
      setters.setCurrentPage(1);
      setters.setHasMoreResults(true);
      await actions.getSongsByArtist(artist);
    },
    [setters, actions]
  );

  const handlePlaylistSelect = useCallback(
    async (playlist: Playlist) => {
      setters.setSelectedPlaylist(playlist);
      setters.setPlaylistViewMode("songs");
      setters.setCurrentPage(1);
      setters.setHasMoreResults(true);
      await actions.getSongsByPlaylist(playlist);
    },
    [setters, actions]
  );

  const handleBackToArtists = useCallback(() => {
    setters.setArtistViewMode("artists");
    setters.setSelectedArtist(null);
    setters.setSelectedAlbum(null);
    setters.setSongResults([]);
    setters.setCurrentPage(1);
    setters.setHasMoreResults(true);
    setters.setIsArtistSectionCollapsed(false);
    setters.setIsSongSectionCollapsed(false);
    setters.setIsAlbumSectionCollapsed(false);
  }, [setters]);

  const handleBackToAlbums = useCallback(() => {
    setters.setArtistViewMode("artists");
    setters.setSelectedAlbum(null);
    setters.setSongResults([]);
    setters.setCurrentPage(1);
    setters.setHasMoreResults(true);
    setters.setIsArtistSectionCollapsed(false);
    setters.setIsSongSectionCollapsed(false);
    setters.setIsAlbumSectionCollapsed(false);
  }, [setters]);

  const handleBackToPlaylists = useCallback(() => {
    setters.setPlaylistViewMode("playlists");
    setters.setSelectedPlaylist(null);
    setters.setSongResults([]);
    setters.setCurrentPage(1);
    setters.setHasMoreResults(true);
  }, [setters]);

  const handleCloseConfirmation = useCallback(() => {
    setters.setShowConfirmation(false);
    setters.setConfirmationMessage("");
    setters.setConfirmationType("success");
  }, [setters]);

  const handleSearchInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setters.setSearchQuery(e.target.value);
    },
    [setters]
  );

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
  }, []);

  return {
    handleLoadMore,
    handleAddSong,
    handleTabChange,
    handleAlbumSelect,
    handleArtistSelect,
    handlePlaylistSelect,
    handleBackToArtists,
    handleBackToAlbums,
    handleBackToPlaylists,
    handleCloseConfirmation,
    handleSearchInputChange,
    handleSearchSubmit,
  };
}
