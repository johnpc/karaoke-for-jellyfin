"use client";

import {
  SearchTabs,
  LoadMoreIndicator,
  LoadMoreButton,
  NoMoreResults,
} from "./";
import { SearchHeader } from "./SearchHeader";
import { ContentStateDisplay } from "./ContentStateDisplay";
import { SearchResultsView } from "./SearchResultsView";
import { SearchContentProps } from "./searchContentTypes";

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
