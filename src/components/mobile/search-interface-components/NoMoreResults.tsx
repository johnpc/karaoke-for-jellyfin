"use client";

import { Artist, Album } from "@/types";

interface NoMoreResultsProps {
  hasSearched: boolean;
  hasMoreResults: boolean;
  isLoadingMore: boolean;
  activeTab: "search" | "playlist";
  artistViewMode: "artists" | "songs";
  playlistViewMode: "playlists" | "songs";
  artistResults: any[];
  albumResults: any[];
  songResults: any[];
  playlistResults: any[];
  selectedArtist: Artist | null;
  selectedAlbum: Album | null;
}

function getNoMoreResultsMessage(props: NoMoreResultsProps): string {
  const {
    activeTab,
    artistViewMode,
    playlistViewMode,
    artistResults,
    albumResults,
    songResults,
    playlistResults,
    selectedArtist,
    selectedAlbum,
  } = props;

  if (activeTab === "search" && artistViewMode === "artists") {
    return `Found all results (${artistResults.length} artists, ${albumResults.length} albums, ${songResults.length} songs)`;
  }

  if (activeTab === "playlist" && playlistViewMode === "playlists") {
    return `Found all playlists (${playlistResults.length} total)`;
  }

  if (activeTab === "search" && artistViewMode === "songs") {
    if (selectedArtist) {
      return `Found all songs by ${selectedArtist.name} (${songResults.length} total)`;
    }
    if (selectedAlbum) {
      return `Found all songs in ${selectedAlbum.name} (${songResults.length} total)`;
    }
  }

  if (activeTab === "playlist" && playlistViewMode === "songs") {
    return `Found all songs in playlist (${songResults.length} total)`;
  }

  return `Found all results (${songResults.length} total)`;
}

function shouldShowNoMoreResults(props: NoMoreResultsProps): boolean {
  const {
    hasSearched,
    hasMoreResults,
    isLoadingMore,
    activeTab,
    artistViewMode,
    playlistViewMode,
    artistResults,
    albumResults,
    songResults,
    playlistResults,
  } = props;

  if (!hasSearched || hasMoreResults || isLoadingMore) {
    return false;
  }

  // Search tab with artists view
  if (activeTab === "search" && artistViewMode === "artists") {
    return (
      artistResults.length > 0 ||
      albumResults.length > 0 ||
      songResults.length > 0
    );
  }

  // Playlist tab with playlists view
  if (activeTab === "playlist" && playlistViewMode === "playlists") {
    return playlistResults.length > 0;
  }

  // Songs view (either search/artist songs or playlist songs)
  if (
    (activeTab === "search" && artistViewMode === "songs") ||
    (activeTab === "playlist" && playlistViewMode === "songs")
  ) {
    return songResults.length > 0;
  }

  return false;
}

export function NoMoreResults(props: NoMoreResultsProps) {
  if (!shouldShowNoMoreResults(props)) return null;

  return (
    <div className="flex items-center justify-center py-6">
      <p className="text-gray-500 text-sm">{getNoMoreResultsMessage(props)}</p>
    </div>
  );
}
