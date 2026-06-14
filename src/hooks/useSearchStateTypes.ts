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
