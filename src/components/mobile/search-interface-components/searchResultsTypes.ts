import { MediaItem, Artist, Album, Playlist } from "@/types";

export type SearchTab = "search" | "playlist";
export type ArtistViewMode = "artists" | "songs";
export type PlaylistViewMode = "playlists" | "songs";

export interface SearchResultsViewProps {
  activeTab: SearchTab;
  artistViewMode: ArtistViewMode;
  playlistViewMode: PlaylistViewMode;
  hasSearched: boolean;
  songResults: MediaItem[];
  artistResults: Artist[];
  albumResults: Album[];
  playlistResults: Playlist[];
  selectedArtist: Artist | null;
  selectedAlbum: Album | null;
  selectedPlaylist: Playlist | null;
  addingSongId: string | null;
  isConnected: boolean;
  isArtistSectionCollapsed: boolean;
  isSongSectionCollapsed: boolean;
  isAlbumSectionCollapsed: boolean;
  setIsArtistSectionCollapsed: (collapsed: boolean) => void;
  setIsSongSectionCollapsed: (collapsed: boolean) => void;
  setIsAlbumSectionCollapsed: (collapsed: boolean) => void;
  handleArtistSelect: (artist: Artist) => void;
  handleAlbumSelect: (album: Album) => void;
  handlePlaylistSelect: (playlist: Playlist) => void;
  handleAddSong: (song: MediaItem) => void;
}
