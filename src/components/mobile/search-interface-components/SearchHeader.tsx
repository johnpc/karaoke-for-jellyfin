"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Artist, Album, Playlist } from "@/types";
import { BackButton } from "./BackButton";

type SearchTab = "search" | "playlist";
type ArtistViewMode = "artists" | "songs";
type PlaylistViewMode = "playlists" | "songs";

interface SearchHeaderProps {
  activeTab: SearchTab;
  artistViewMode: ArtistViewMode;
  playlistViewMode: PlaylistViewMode;
  searchQuery: string;
  selectedArtist: Artist | null;
  selectedAlbum: Album | null;
  selectedPlaylist: Playlist | null;
  handleBackToArtists: () => void;
  handleBackToAlbums: () => void;
  handleBackToPlaylists: () => void;
  handleSearchInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearchSubmit: (e: React.FormEvent) => void;
  getPlaceholderText: () => string;
}

export function SearchHeader(props: SearchHeaderProps) {
  const {
    activeTab,
    artistViewMode,
    playlistViewMode,
    searchQuery,
    selectedArtist,
    selectedAlbum,
    selectedPlaylist,
    handleBackToArtists,
    handleBackToAlbums,
    handleBackToPlaylists,
    handleSearchInputChange,
    handleSearchSubmit,
    getPlaceholderText,
  } = props;

  return (
    <div className="p-4 bg-white border-b border-gray-200">
      {/* Back button for artist/album songs view */}
      {activeTab === "search" &&
        artistViewMode === "songs" &&
        (selectedArtist || selectedAlbum) && (
          <BackButton
            onBack={selectedArtist ? handleBackToArtists : handleBackToAlbums}
            label={
              selectedArtist
                ? `Back to Artists`
                : selectedAlbum
                  ? `Back to Albums`
                  : "Back"
            }
          />
        )}

      {/* Back button for playlist songs view */}
      {activeTab === "playlist" &&
        playlistViewMode === "songs" &&
        selectedPlaylist && (
          <BackButton
            onBack={handleBackToPlaylists}
            label="Back to Playlists"
          />
        )}

      {/* Search form - hide for playlist list view */}
      {!(activeTab === "playlist" && playlistViewMode === "playlists") && (
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder={getPlaceholderText()}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              data-testid="search-input"
            />
          </div>
        </form>
      )}
    </div>
  );
}
