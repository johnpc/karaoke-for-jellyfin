"use client";

import { useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { MediaItem, Artist, Playlist, Album } from "@/types";
import {
  SearchTabs,
  BackButton,
  LoadingSpinner,
  EmptyState,
  ArtistResults,
  AlbumResults,
  SongResults,
  PlaylistResults,
  LoadMoreIndicator,
  LoadMoreButton,
  NoMoreResults,
} from "./";

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
  const {
    activeTab,
    artistViewMode,
    playlistViewMode,
    searchQuery,
    selectedArtist,
    selectedAlbum,
    selectedPlaylist,
    songResults,
    artistResults,
    albumResults,
    playlistResults,
    isLoading,
    isLoadingMore,
    hasSearched,
    hasMoreResults,
    error,
    addingSongId,
    isConnected,
    isArtistSectionCollapsed,
    isSongSectionCollapsed,
    isAlbumSectionCollapsed,
    handleTabChange,
    handleSearchInputChange,
    handleSearchSubmit,
    handleArtistSelect,
    handleAlbumSelect,
    handlePlaylistSelect,
    handleBackToArtists,
    handleBackToAlbums,
    handleBackToPlaylists,
    handleAddSong,
    handleLoadMore,
    setIsArtistSectionCollapsed,
    setIsSongSectionCollapsed,
    setIsAlbumSectionCollapsed,
    formatDuration,
    getPlaceholderText,
  } = props;

  return (
    <div className="flex flex-col h-full">
      {/* Search Tabs */}
      <SearchTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Search Input */}
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

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Loading Spinner */}
        {isLoading &&
          songResults.length === 0 &&
          artistResults.length === 0 &&
          albumResults.length === 0 &&
          playlistResults.length === 0 && (
            <LoadingSpinner
              message={
                activeTab === "search" && artistViewMode === "artists"
                  ? "Searching..."
                  : activeTab === "search" && artistViewMode === "songs"
                    ? selectedArtist
                      ? `Finding songs by ${selectedArtist.name}...`
                      : selectedAlbum
                        ? `Finding songs in ${selectedAlbum.name}...`
                        : "Finding songs..."
                    : activeTab === "playlist" &&
                        playlistViewMode === "playlists"
                      ? "Loading playlists..."
                      : activeTab === "playlist" && playlistViewMode === "songs"
                        ? `Loading songs from ${selectedPlaylist?.name}...`
                        : "Searching..."
              }
            />
          )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading &&
          ((activeTab === "search" &&
            artistViewMode === "artists" &&
            artistResults.length === 0 &&
            albumResults.length === 0 &&
            songResults.length === 0) ||
            (activeTab === "search" &&
              artistViewMode === "songs" &&
              songResults.length === 0) ||
            (activeTab === "playlist" &&
              playlistViewMode === "playlists" &&
              playlistResults.length === 0) ||
            (activeTab === "playlist" &&
              playlistViewMode === "songs" &&
              songResults.length === 0)) &&
          hasSearched && (
            <EmptyState
              type={
                activeTab === "search" && artistViewMode === "artists"
                  ? "search"
                  : activeTab === "playlist" && playlistViewMode === "playlists"
                    ? "playlist"
                    : "songs"
              }
              hasSearched={hasSearched}
            />
          )}

        {/* Initial state */}
        {!isLoading && !hasSearched && activeTab !== "playlist" && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <MagnifyingGlassIcon className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Search Music
            </h3>
            <p className="text-gray-500 text-center">
              {activeTab === "search"
                ? "Search for artists and songs to add to the queue"
                : artistViewMode === "artists"
                  ? "Search for artists to browse their songs"
                  : `Browse songs by ${selectedArtist?.name || "this artist"}`}
            </p>
          </div>
        )}

        {/* Unified Search Results - Artists, Albums, and Songs */}
        {activeTab === "search" &&
          artistViewMode === "artists" &&
          hasSearched && (
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
          )}

        {/* Artist Songs */}
        {activeTab === "search" &&
          artistViewMode === "songs" &&
          selectedArtist && (
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
          )}

        {/* Album Songs */}
        {activeTab === "search" &&
          artistViewMode === "songs" &&
          selectedAlbum && (
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
          )}

        {/* Playlist Results */}
        {activeTab === "playlist" && playlistViewMode === "playlists" && (
          <PlaylistResults
            playlists={playlistResults}
            onPlaylistSelect={handlePlaylistSelect}
          />
        )}

        {/* Playlist Songs */}
        {activeTab === "playlist" &&
          playlistViewMode === "songs" &&
          selectedPlaylist && (
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
          )}

        {/* Loading More Indicator */}
        <LoadMoreIndicator
          isLoadingMore={isLoadingMore}
          activeTab={activeTab}
          artistViewMode={artistViewMode}
          playlistViewMode={playlistViewMode}
        />

        {/* Load More Button */}
        <LoadMoreButton
          hasSearched={hasSearched}
          hasMoreResults={hasMoreResults}
          isLoadingMore={isLoadingMore}
          isLoading={isLoading}
          activeTab={activeTab}
          artistViewMode={artistViewMode}
          playlistViewMode={playlistViewMode}
          artistResults={artistResults}
          albumResults={albumResults}
          songResults={songResults}
          playlistResults={playlistResults}
          onLoadMore={handleLoadMore}
        />

        {/* No More Results */}
        <NoMoreResults
          hasSearched={hasSearched}
          hasMoreResults={hasMoreResults}
          isLoadingMore={isLoadingMore}
          activeTab={activeTab}
          artistViewMode={artistViewMode}
          playlistViewMode={playlistViewMode}
          artistResults={artistResults}
          albumResults={albumResults}
          songResults={songResults}
          playlistResults={playlistResults}
          selectedArtist={selectedArtist}
          selectedAlbum={selectedAlbum}
        />
      </div>
    </div>
  );
}
