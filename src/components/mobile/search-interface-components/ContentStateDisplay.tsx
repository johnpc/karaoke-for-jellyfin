"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { MediaItem, Artist, Album, Playlist } from "@/types";
import { LoadingSpinner, EmptyState } from "./";

type SearchTab = "search" | "playlist";
type ArtistViewMode = "artists" | "songs";
type PlaylistViewMode = "playlists" | "songs";

interface ContentStateDisplayProps {
  isLoading: boolean;
  hasSearched: boolean;
  error: string | null;
  activeTab: SearchTab;
  artistViewMode: ArtistViewMode;
  playlistViewMode: PlaylistViewMode;
  selectedArtist: Artist | null;
  selectedAlbum: Album | null;
  selectedPlaylist: Playlist | null;
  songResults: MediaItem[];
  artistResults: Artist[];
  albumResults: Album[];
  playlistResults: Playlist[];
}

function getLoadingMessage(
  activeTab: SearchTab,
  artistViewMode: ArtistViewMode,
  playlistViewMode: PlaylistViewMode,
  selectedArtist: Artist | null,
  selectedAlbum: Album | null,
  selectedPlaylist: Playlist | null
): string {
  if (activeTab === "search" && artistViewMode === "artists") {
    return "Searching...";
  }
  if (activeTab === "search" && artistViewMode === "songs") {
    if (selectedArtist) return `Finding songs by ${selectedArtist.name}...`;
    if (selectedAlbum) return `Finding songs in ${selectedAlbum.name}...`;
    return "Finding songs...";
  }
  if (activeTab === "playlist" && playlistViewMode === "playlists") {
    return "Loading playlists...";
  }
  if (activeTab === "playlist" && playlistViewMode === "songs") {
    return `Loading songs from ${selectedPlaylist?.name}...`;
  }
  return "Searching...";
}

function hasNoResults(
  activeTab: SearchTab,
  artistViewMode: ArtistViewMode,
  playlistViewMode: PlaylistViewMode,
  songResults: MediaItem[],
  artistResults: Artist[],
  albumResults: Album[],
  playlistResults: Playlist[]
): boolean {
  if (activeTab === "search" && artistViewMode === "artists") {
    return (
      artistResults.length === 0 &&
      albumResults.length === 0 &&
      songResults.length === 0
    );
  }
  if (activeTab === "search" && artistViewMode === "songs") {
    return songResults.length === 0;
  }
  if (activeTab === "playlist" && playlistViewMode === "playlists") {
    return playlistResults.length === 0;
  }
  if (activeTab === "playlist" && playlistViewMode === "songs") {
    return songResults.length === 0;
  }
  return false;
}

function getEmptyStateType(
  activeTab: SearchTab,
  artistViewMode: ArtistViewMode,
  playlistViewMode: PlaylistViewMode
): "search" | "playlist" | "songs" {
  if (activeTab === "search" && artistViewMode === "artists") return "search";
  if (activeTab === "playlist" && playlistViewMode === "playlists")
    return "playlist";
  return "songs";
}

export function ContentStateDisplay(props: ContentStateDisplayProps) {
  const {
    isLoading,
    hasSearched,
    error,
    activeTab,
    artistViewMode,
    playlistViewMode,
    selectedArtist,
    selectedAlbum,
    selectedPlaylist,
    songResults,
    artistResults,
    albumResults,
    playlistResults,
  } = props;

  const allResultsEmpty =
    songResults.length === 0 &&
    artistResults.length === 0 &&
    albumResults.length === 0 &&
    playlistResults.length === 0;

  /* Loading Spinner */
  if (isLoading && allResultsEmpty) {
    const message = getLoadingMessage(
      activeTab,
      artistViewMode,
      playlistViewMode,
      selectedArtist,
      selectedAlbum,
      selectedPlaylist
    );
    return <LoadingSpinner message={message} />;
  }

  /* Error Message */
  if (error) {
    return (
      <div className="p-4 bg-red-50 border-l-4 border-red-400">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  /* Empty State */
  const noResults = hasNoResults(
    activeTab,
    artistViewMode,
    playlistViewMode,
    songResults,
    artistResults,
    albumResults,
    playlistResults
  );
  if (!isLoading && noResults && hasSearched) {
    return (
      <EmptyState
        type={getEmptyStateType(activeTab, artistViewMode, playlistViewMode)}
        hasSearched={hasSearched}
      />
    );
  }

  /* Initial state */
  if (!isLoading && !hasSearched && activeTab !== "playlist") {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <MagnifyingGlassIcon className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Search Music</h3>
        <p className="text-gray-500 text-center">
          {activeTab === "search"
            ? "Search for artists and songs to add to the queue"
            : artistViewMode === "artists"
              ? "Search for artists to browse their songs"
              : `Browse songs by ${selectedArtist?.name || "this artist"}`}
        </p>
      </div>
    );
  }

  return null;
}
