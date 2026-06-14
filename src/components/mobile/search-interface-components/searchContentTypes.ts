import { MediaItem, Artist, Playlist, Album } from "@/types";

export type SearchTab = "search" | "playlist";
export type ArtistViewMode = "artists" | "songs";
export type PlaylistViewMode = "playlists" | "songs";

export interface SearchContentProps {
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
}
