import { MediaItem, Artist, Album, Playlist } from "@/types";

export type SearchTab = "search" | "playlist";
export type ArtistViewMode = "artists" | "songs";
export type PlaylistViewMode = "playlists" | "songs";

export interface ContentStateDisplayProps {
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

export function getLoadingMessage(
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

export function hasNoResults(
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

export function getEmptyStateType(
  activeTab: SearchTab,
  artistViewMode: ArtistViewMode,
  playlistViewMode: PlaylistViewMode
): "search" | "playlist" | "songs" {
  if (activeTab === "search" && artistViewMode === "artists") return "search";
  if (activeTab === "playlist" && playlistViewMode === "playlists")
    return "playlist";
  return "songs";
}
