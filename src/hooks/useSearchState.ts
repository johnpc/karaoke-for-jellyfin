"use client";

import { useState } from "react";
import { MediaItem, Artist, Playlist, Album } from "@/types";

export type SearchTab = "search" | "playlist";
export type ArtistViewMode = "artists" | "songs";
export type PlaylistViewMode = "playlists" | "songs";

export interface SearchState {
  activeTab: SearchTab;
  artistViewMode: ArtistViewMode;
  playlistViewMode: PlaylistViewMode;
  selectedArtist: Artist | null;
  selectedAlbum: Album | null;
  selectedPlaylist: Playlist | null;
  searchQuery: string;
  songResults: MediaItem[];
  artistResults: Artist[];
  albumResults: Album[];
  playlistResults: Playlist[];
  isArtistSectionCollapsed: boolean;
  isSongSectionCollapsed: boolean;
  isAlbumSectionCollapsed: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasSearched: boolean;
  hasMoreResults: boolean;
  currentPage: number;
  showConfirmation: boolean;
  confirmationMessage: string;
  confirmationType: "success" | "error";
  addingSongId: string | null;
}

export interface SearchStateSetters {
  setActiveTab: (tab: SearchTab) => void;
  setArtistViewMode: (mode: ArtistViewMode) => void;
  setPlaylistViewMode: (mode: PlaylistViewMode) => void;
  setSelectedArtist: (artist: Artist | null) => void;
  setSelectedAlbum: (album: Album | null) => void;
  setSelectedPlaylist: (playlist: Playlist | null) => void;
  setSearchQuery: (query: string) => void;
  setSongResults: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  setArtistResults: React.Dispatch<React.SetStateAction<Artist[]>>;
  setAlbumResults: React.Dispatch<React.SetStateAction<Album[]>>;
  setPlaylistResults: React.Dispatch<React.SetStateAction<Playlist[]>>;
  setIsArtistSectionCollapsed: (collapsed: boolean) => void;
  setIsSongSectionCollapsed: (collapsed: boolean) => void;
  setIsAlbumSectionCollapsed: (collapsed: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setIsLoadingMore: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasSearched: (searched: boolean) => void;
  setHasMoreResults: (hasMore: boolean) => void;
  setCurrentPage: (page: number) => void;
  setShowConfirmation: (show: boolean) => void;
  setConfirmationMessage: (message: string) => void;
  setConfirmationType: (type: "success" | "error") => void;
  setAddingSongId: (id: string | null) => void;
}

export interface UseSearchStateReturn {
  state: SearchState;
  setters: SearchStateSetters;
}

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
