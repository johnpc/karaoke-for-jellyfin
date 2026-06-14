"use client";

import { useCallback } from "react";
import { MediaItem } from "@/types";
import {
  SearchState,
  SearchStateSetters,
  SearchTab,
} from "@/hooks/useSearchState";
import { UseSearchActionsReturn } from "@/hooks/useSearchActions";
import {
  dispatchLoadMore,
  buildConfirmationSuccess,
  buildConfirmationError,
} from "./dispatchers";
import {
  useNavigationHandlers,
  NavigationHandlers,
} from "./useNavigationHandlers";
import {
  useSearchDebounce,
  useInitialArtistLoad,
} from "./useSearchSideEffects";

export interface UseSearchEffectsReturn extends NavigationHandlers {
  handleLoadMore: () => void;
  handleAddSong: (song: MediaItem) => void;
  handleTabChange: (tab: SearchTab) => void;
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
  useSearchDebounce(state, actions);
  useInitialArtistLoad(state, setters);

  const handleLoadMore = useCallback(() => {
    if (!state.hasMoreResults || state.isLoadingMore || state.isLoading) return;
    dispatchLoadMore(state, actions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.hasMoreResults,
    state.isLoadingMore,
    state.isLoading,
    state.activeTab,
    state.artistViewMode,
    state.playlistViewMode,
    state.searchQuery,
    state.selectedArtist,
    state.selectedAlbum,
    state.selectedPlaylist,
    state.currentPage,
    actions,
  ]);

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

  const navigationHandlers = useNavigationHandlers(setters, actions);

  const handleSearchInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setters.setSearchQuery(value);
      if (!value.trim() && state.activeTab === "search") {
        setters.setSongResults([]);
        setters.setAlbumResults([]);
        setters.setHasSearched(false);
        setters.setHasMoreResults(true);
        setters.setCurrentPage(1);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setters, state.activeTab]
  );

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
  }, []);

  return {
    handleLoadMore,
    handleAddSong,
    handleTabChange,
    handleSearchInputChange,
    handleSearchSubmit,
    ...navigationHandlers,
  };
}
