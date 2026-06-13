"use client";

import { useCallback } from "react";
import { MediaItem, Artist, Album, Playlist } from "@/types";
import { useSearchState } from "@/hooks/useSearchState";
import { useSearchActions } from "@/hooks/useSearchActions";
import { useSearchEffects } from "@/hooks/useSearchEffects";

type SearchTab = "search" | "playlist";
type ArtistViewMode = "artists" | "songs";
type PlaylistViewMode = "playlists" | "songs";

export interface UseSearchInterfaceReturn {
  // State
  activeTab: SearchTab;
  artistViewMode: ArtistViewMode;
  playlistViewMode: PlaylistViewMode;
  searchQuery: string;
  selectedArtist: Artist | null;
  selectedAlbum: Album | null;
  selectedPlaylist: Playlist | null;

  // Results
  songResults: MediaItem[];
  artistResults: Artist[];
  albumResults: Album[];
  playlistResults: Playlist[];

  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;
  hasSearched: boolean;
  hasMoreResults: boolean;
  error: string | null;
  addingSongId: string | null;
  isConnected: boolean;

  // Collapse states
  isArtistSectionCollapsed: boolean;
  isSongSectionCollapsed: boolean;
  isAlbumSectionCollapsed: boolean;

  // Event handlers
  handleTabChange: (tab: SearchTab) => void;
  handleSearchInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearchSubmit: (e: React.FormEvent) => void;
  handleArtistSelect: (artist: Artist) => void;
  handleAlbumSelect: (album: Album) => void;
  handlePlaylistSelect: (playlist: Playlist) => void;
  handleBackToArtists: () => void;
  handleBackToAlbums: () => void;
  handleBackToPlaylists: () => void;
  handleAddSong: (song: MediaItem) => void;
  handleLoadMore: () => void;
  setIsArtistSectionCollapsed: (collapsed: boolean) => void;
  setIsSongSectionCollapsed: (collapsed: boolean) => void;
  setIsAlbumSectionCollapsed: (collapsed: boolean) => void;

  // Utility functions
  formatDuration: (seconds: number) => string;
  getPlaceholderText: () => string;

  // Confirmation dialog state
  showConfirmation: boolean;
  confirmationTitle: string;
  confirmationMessage: string;
  confirmationType: "success" | "error";
  handleCloseConfirmation: () => void;
}

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
    // State
    activeTab: state.activeTab,
    artistViewMode: state.artistViewMode,
    playlistViewMode: state.playlistViewMode,
    searchQuery: state.searchQuery,
    selectedArtist: state.selectedArtist,
    selectedAlbum: state.selectedAlbum,
    selectedPlaylist: state.selectedPlaylist,

    // Results
    songResults: state.songResults,
    artistResults: state.artistResults,
    albumResults: state.albumResults,
    playlistResults: state.playlistResults,

    // Loading states
    isLoading: state.isLoading,
    isLoadingMore: state.isLoadingMore,
    hasSearched: state.hasSearched,
    hasMoreResults: state.hasMoreResults,
    error: state.error,
    addingSongId: state.addingSongId,
    isConnected,

    // Collapse states
    isArtistSectionCollapsed: state.isArtistSectionCollapsed,
    isSongSectionCollapsed: state.isSongSectionCollapsed,
    isAlbumSectionCollapsed: state.isAlbumSectionCollapsed,

    // Event handlers
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

    // Utility functions
    formatDuration,
    getPlaceholderText,

    // Confirmation dialog state
    showConfirmation: state.showConfirmation,
    confirmationTitle,
    confirmationMessage: state.confirmationMessage,
    confirmationType: state.confirmationType,
    handleCloseConfirmation: effects.handleCloseConfirmation,
  };
}
