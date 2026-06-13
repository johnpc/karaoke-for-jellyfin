"use client";

import { MediaItem, Artist, Album, Playlist } from "@/types";
import { ArtistResults, AlbumResults, SongResults, PlaylistResults } from "./";

type SearchTab = "search" | "playlist";
type ArtistViewMode = "artists" | "songs";
type PlaylistViewMode = "playlists" | "songs";

interface SearchResultsViewProps {
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

export function SearchResultsView(props: SearchResultsViewProps) {
  const {
    activeTab,
    artistViewMode,
    playlistViewMode,
    hasSearched,
    songResults,
    artistResults,
    albumResults,
    playlistResults,
    selectedArtist,
    selectedAlbum,
    selectedPlaylist,
    addingSongId,
    isConnected,
    isArtistSectionCollapsed,
    isSongSectionCollapsed,
    isAlbumSectionCollapsed,
    setIsArtistSectionCollapsed,
    setIsSongSectionCollapsed,
    setIsAlbumSectionCollapsed,
    handleArtistSelect,
    handleAlbumSelect,
    handlePlaylistSelect,
    handleAddSong,
  } = props;

  /* Unified Search Results - Artists, Albums, and Songs */
  if (activeTab === "search" && artistViewMode === "artists" && hasSearched) {
    return (
      <div data-testid="search-results">
        <ArtistResults
          artists={artistResults}
          isCollapsed={isArtistSectionCollapsed}
          onToggleCollapse={() =>
            setIsArtistSectionCollapsed(!isArtistSectionCollapsed)
          }
          onArtistSelect={handleArtistSelect}
        />
        <AlbumResults
          albums={albumResults}
          isCollapsed={isAlbumSectionCollapsed}
          onToggleCollapse={() =>
            setIsAlbumSectionCollapsed(!isAlbumSectionCollapsed)
          }
          onAlbumSelect={handleAlbumSelect}
        />
        <SongResults
          songs={songResults}
          isCollapsed={isSongSectionCollapsed}
          onToggleCollapse={() =>
            setIsSongSectionCollapsed(!isSongSectionCollapsed)
          }
          onAddSong={handleAddSong}
          addingSongId={addingSongId}
          isConnected={isConnected}
          showHeader={hasSearched && songResults.length > 0}
          testId="song-results"
        />
      </div>
    );
  }

  /* Artist Songs */
  if (activeTab === "search" && artistViewMode === "songs" && selectedArtist) {
    return (
      <SongResults
        songs={songResults}
        isCollapsed={false}
        onToggleCollapse={() => {}}
        onAddSong={handleAddSong}
        addingSongId={addingSongId}
        isConnected={isConnected}
        showHeader={false}
        testId="artist-songs"
      />
    );
  }

  /* Album Songs */
  if (activeTab === "search" && artistViewMode === "songs" && selectedAlbum) {
    return (
      <SongResults
        songs={songResults}
        isCollapsed={false}
        onToggleCollapse={() => {}}
        onAddSong={handleAddSong}
        addingSongId={addingSongId}
        isConnected={isConnected}
        showHeader={false}
        testId="album-songs"
      />
    );
  }

  /* Playlist Results */
  if (activeTab === "playlist" && playlistViewMode === "playlists") {
    return (
      <PlaylistResults
        playlists={playlistResults}
        onPlaylistSelect={handlePlaylistSelect}
      />
    );
  }

  /* Playlist Songs */
  if (
    activeTab === "playlist" &&
    playlistViewMode === "songs" &&
    selectedPlaylist
  ) {
    return (
      <SongResults
        songs={songResults}
        isCollapsed={false}
        onToggleCollapse={() => {}}
        onAddSong={handleAddSong}
        addingSongId={addingSongId}
        isConnected={isConnected}
        showHeader={false}
        testId="playlist-songs"
      />
    );
  }

  return null;
}
