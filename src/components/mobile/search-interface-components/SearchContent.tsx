"use client";

import { MediaItem, Artist, Playlist, Album } from "@/types";
import {
  SearchTabs,
  LoadMoreIndicator,
  LoadMoreButton,
  NoMoreResults,
} from "./";
import { SearchHeader } from "./SearchHeader";
import { ContentStateDisplay } from "./ContentStateDisplay";
import { SearchResultsView } from "./SearchResultsView";

type SearchTab = "search" | "playlist";
type ArtistViewMode = "artists" | "songs";
type PlaylistViewMode = "playlists" | "songs";

interface SearchContentProps {
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

export function SearchContent(props: SearchContentProps) {
  return (
    <div className="flex flex-col h-full">
      <SearchTabs
        activeTab={props.activeTab}
        onTabChange={props.handleTabChange}
      />

      <SearchHeader
        activeTab={props.activeTab}
        artistViewMode={props.artistViewMode}
        playlistViewMode={props.playlistViewMode}
        searchQuery={props.searchQuery}
        selectedArtist={props.selectedArtist}
        selectedAlbum={props.selectedAlbum}
        selectedPlaylist={props.selectedPlaylist}
        handleBackToArtists={props.handleBackToArtists}
        handleBackToAlbums={props.handleBackToAlbums}
        handleBackToPlaylists={props.handleBackToPlaylists}
        handleSearchInputChange={props.handleSearchInputChange}
        handleSearchSubmit={props.handleSearchSubmit}
        getPlaceholderText={props.getPlaceholderText}
      />

      <div className="flex-1 overflow-y-auto">
        <ContentStateDisplay
          isLoading={props.isLoading}
          hasSearched={props.hasSearched}
          error={props.error}
          activeTab={props.activeTab}
          artistViewMode={props.artistViewMode}
          playlistViewMode={props.playlistViewMode}
          selectedArtist={props.selectedArtist}
          selectedAlbum={props.selectedAlbum}
          selectedPlaylist={props.selectedPlaylist}
          songResults={props.songResults}
          artistResults={props.artistResults}
          albumResults={props.albumResults}
          playlistResults={props.playlistResults}
        />

        <SearchResultsView
          activeTab={props.activeTab}
          artistViewMode={props.artistViewMode}
          playlistViewMode={props.playlistViewMode}
          hasSearched={props.hasSearched}
          songResults={props.songResults}
          artistResults={props.artistResults}
          albumResults={props.albumResults}
          playlistResults={props.playlistResults}
          selectedArtist={props.selectedArtist}
          selectedAlbum={props.selectedAlbum}
          selectedPlaylist={props.selectedPlaylist}
          addingSongId={props.addingSongId}
          isConnected={props.isConnected}
          isArtistSectionCollapsed={props.isArtistSectionCollapsed}
          isSongSectionCollapsed={props.isSongSectionCollapsed}
          isAlbumSectionCollapsed={props.isAlbumSectionCollapsed}
          setIsArtistSectionCollapsed={props.setIsArtistSectionCollapsed}
          setIsSongSectionCollapsed={props.setIsSongSectionCollapsed}
          setIsAlbumSectionCollapsed={props.setIsAlbumSectionCollapsed}
          handleArtistSelect={props.handleArtistSelect}
          handleAlbumSelect={props.handleAlbumSelect}
          handlePlaylistSelect={props.handlePlaylistSelect}
          handleAddSong={props.handleAddSong}
        />

        <LoadMoreIndicator
          isLoadingMore={props.isLoadingMore}
          activeTab={props.activeTab}
          artistViewMode={props.artistViewMode}
          playlistViewMode={props.playlistViewMode}
        />

        <LoadMoreButton
          hasSearched={props.hasSearched}
          hasMoreResults={props.hasMoreResults}
          isLoadingMore={props.isLoadingMore}
          isLoading={props.isLoading}
          activeTab={props.activeTab}
          artistViewMode={props.artistViewMode}
          playlistViewMode={props.playlistViewMode}
          artistResults={props.artistResults}
          albumResults={props.albumResults}
          songResults={props.songResults}
          playlistResults={props.playlistResults}
          onLoadMore={props.handleLoadMore}
        />

        <NoMoreResults
          hasSearched={props.hasSearched}
          hasMoreResults={props.hasMoreResults}
          isLoadingMore={props.isLoadingMore}
          activeTab={props.activeTab}
          artistViewMode={props.artistViewMode}
          playlistViewMode={props.playlistViewMode}
          artistResults={props.artistResults}
          albumResults={props.albumResults}
          songResults={props.songResults}
          playlistResults={props.playlistResults}
          selectedArtist={props.selectedArtist}
          selectedAlbum={props.selectedAlbum}
        />
      </div>
    </div>
  );
}
