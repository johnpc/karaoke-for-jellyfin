import { MediaItem, Artist, Album, Playlist } from "@/types";

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
