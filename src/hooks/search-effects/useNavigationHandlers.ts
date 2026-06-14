"use client";

import { useCallback } from "react";
import { Artist, Album, Playlist } from "@/types";
import { SearchStateSetters } from "@/hooks/useSearchState";
import { UseSearchActionsReturn } from "@/hooks/useSearchActions";

export interface NavigationHandlers {
  handleAlbumSelect: (album: Album) => void;
  handleArtistSelect: (artist: Artist) => void;
  handlePlaylistSelect: (playlist: Playlist) => void;
  handleBackToArtists: () => void;
  handleBackToAlbums: () => void;
  handleBackToPlaylists: () => void;
  handleCloseConfirmation: () => void;
}

export function useNavigationHandlers(
  setters: SearchStateSetters,
  actions: UseSearchActionsReturn
): NavigationHandlers {
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

  return {
    handleAlbumSelect,
    handleArtistSelect,
    handlePlaylistSelect,
    handleBackToArtists,
    handleBackToAlbums,
    handleBackToPlaylists,
    handleCloseConfirmation,
  };
}
