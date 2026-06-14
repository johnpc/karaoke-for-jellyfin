"use client";

import { useCallback } from "react";
import { MediaItem } from "@/types";
import { useSearchState } from "@/hooks/useSearchState";
import { useSearchActions } from "@/hooks/useSearchActions";
import { useSearchEffects } from "@/hooks/search-effects";
import { UseSearchInterfaceReturn } from "./useSearchInterfaceTypes";

export type { UseSearchInterfaceReturn } from "./useSearchInterfaceTypes";

export function useSearchInterface(
  onAddSong: (mediaItem: MediaItem) => Promise<void>,
  isConnected: boolean
): UseSearchInterfaceReturn {
  const { state, setters } = useSearchState();
  const actions = useSearchActions(setters);
  const effects = useSearchEffects(
    state,
    setters,
    actions,
    onAddSong,
    isConnected
  );

  const formatDuration = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, []);

  const getPlaceholderText = useCallback((): string => {
    if (state.activeTab === "search") {
      if (state.artistViewMode === "artists") {
        return "Search for artists, albums, and songs...";
      }
      if (state.selectedArtist) {
        return `Search songs by ${state.selectedArtist.name}...`;
      }
      if (state.selectedAlbum) {
        return `Search songs in ${state.selectedAlbum.name}...`;
      }
    }
    return "Search...";
  }, [
    state.activeTab,
    state.artistViewMode,
    state.selectedArtist,
    state.selectedAlbum,
  ]);

  const confirmationTitle =
    state.confirmationType === "success" ? "Song Added!" : "Error Adding Song";

  return {
    activeTab: state.activeTab,
    artistViewMode: state.artistViewMode,
    playlistViewMode: state.playlistViewMode,
    searchQuery: state.searchQuery,
    selectedArtist: state.selectedArtist,
    selectedAlbum: state.selectedAlbum,
    selectedPlaylist: state.selectedPlaylist,
    songResults: state.songResults,
    artistResults: state.artistResults,
    albumResults: state.albumResults,
    playlistResults: state.playlistResults,
    isLoading: state.isLoading,
    isLoadingMore: state.isLoadingMore,
    hasSearched: state.hasSearched,
    hasMoreResults: state.hasMoreResults,
    error: state.error,
    addingSongId: state.addingSongId,
    isConnected,
    isArtistSectionCollapsed: state.isArtistSectionCollapsed,
    isSongSectionCollapsed: state.isSongSectionCollapsed,
    isAlbumSectionCollapsed: state.isAlbumSectionCollapsed,
    handleTabChange: effects.handleTabChange,
    handleSearchInputChange: effects.handleSearchInputChange,
    handleSearchSubmit: effects.handleSearchSubmit,
    handleArtistSelect: effects.handleArtistSelect,
    handleAlbumSelect: effects.handleAlbumSelect,
    handlePlaylistSelect: effects.handlePlaylistSelect,
    handleBackToArtists: effects.handleBackToArtists,
    handleBackToAlbums: effects.handleBackToAlbums,
    handleBackToPlaylists: effects.handleBackToPlaylists,
    handleAddSong: effects.handleAddSong,
    handleLoadMore: effects.handleLoadMore,
    setIsArtistSectionCollapsed: setters.setIsArtistSectionCollapsed,
    setIsSongSectionCollapsed: setters.setIsSongSectionCollapsed,
    setIsAlbumSectionCollapsed: setters.setIsAlbumSectionCollapsed,
    formatDuration,
    getPlaceholderText,
    showConfirmation: state.showConfirmation,
    confirmationTitle,
    confirmationMessage: state.confirmationMessage,
    confirmationType: state.confirmationType,
    handleCloseConfirmation: effects.handleCloseConfirmation,
  };
}
