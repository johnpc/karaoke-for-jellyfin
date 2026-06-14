"use client";

import { useState } from "react";
import { MediaItem, Artist, Playlist, Album } from "@/types";
import {
  SearchTab,
  ArtistViewMode,
  PlaylistViewMode,
  SearchState,
  SearchStateSetters,
  UseSearchStateReturn,
} from "./useSearchStateTypes";

export type { SearchTab, ArtistViewMode, PlaylistViewMode };
export type { SearchState, SearchStateSetters, UseSearchStateReturn };

export function useSearchState(): UseSearchStateReturn {
  const [activeTab, setActiveTab] = useState<SearchTab>("search");
  const [artistViewMode, setArtistViewMode] =
    useState<ArtistViewMode>("artists");
  const [playlistViewMode, setPlaylistViewMode] =
    useState<PlaylistViewMode>("playlists");
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(
    null
  );
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [songResults, setSongResults] = useState<MediaItem[]>([]);
  const [artistResults, setArtistResults] = useState<Artist[]>([]);
  const [albumResults, setAlbumResults] = useState<Album[]>([]);
  const [playlistResults, setPlaylistResults] = useState<Playlist[]>([]);

  const [isArtistSectionCollapsed, setIsArtistSectionCollapsed] =
    useState(false);
  const [isSongSectionCollapsed, setIsSongSectionCollapsed] = useState(false);
  const [isAlbumSectionCollapsed, setIsAlbumSectionCollapsed] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [hasMoreResults, setHasMoreResults] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [confirmationType, setConfirmationType] = useState<"success" | "error">(
    "success"
  );
  const [addingSongId, setAddingSongId] = useState<string | null>(null);

  const state: SearchState = {
    activeTab,
    artistViewMode,
    playlistViewMode,
    selectedArtist,
    selectedAlbum,
    selectedPlaylist,
    searchQuery,
    songResults,
    artistResults,
    albumResults,
    playlistResults,
    isArtistSectionCollapsed,
    isSongSectionCollapsed,
    isAlbumSectionCollapsed,
    isLoading,
    isLoadingMore,
    error,
    hasSearched,
    hasMoreResults,
    currentPage,
    showConfirmation,
    confirmationMessage,
    confirmationType,
    addingSongId,
  };

  const setters: SearchStateSetters = {
    setActiveTab,
    setArtistViewMode,
    setPlaylistViewMode,
    setSelectedArtist,
    setSelectedAlbum,
    setSelectedPlaylist,
    setSearchQuery,
    setSongResults,
    setArtistResults,
    setAlbumResults,
    setPlaylistResults,
    setIsArtistSectionCollapsed,
    setIsSongSectionCollapsed,
    setIsAlbumSectionCollapsed,
    setIsLoading,
    setIsLoadingMore,
    setError,
    setHasSearched,
    setHasMoreResults,
    setCurrentPage,
    setShowConfirmation,
    setConfirmationMessage,
    setConfirmationType,
    setAddingSongId,
  };

  return { state, setters };
}
