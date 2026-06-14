"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { LoadingSpinner, EmptyState } from "./";
import {
  ContentStateDisplayProps,
  getLoadingMessage,
  hasNoResults,
  getEmptyStateType,
} from "./contentStateHelpers";

export function ContentStateDisplay(props: ContentStateDisplayProps) {
  const {
    isLoading,
    hasSearched,
    error,
    activeTab,
    artistViewMode,
    playlistViewMode,
    selectedArtist,
    selectedAlbum,
    selectedPlaylist,
    songResults,
    artistResults,
    albumResults,
    playlistResults,
  } = props;

  const allResultsEmpty =
    songResults.length === 0 &&
    artistResults.length === 0 &&
    albumResults.length === 0 &&
    playlistResults.length === 0;

  /* Loading Spinner */
  if (isLoading && allResultsEmpty) {
    const message = getLoadingMessage(
      activeTab,
      artistViewMode,
      playlistViewMode,
      selectedArtist,
      selectedAlbum,
      selectedPlaylist
    );
    return <LoadingSpinner message={message} />;
  }

  /* Error Message */
  if (error) {
    return (
      <div className="p-4 bg-red-50 border-l-4 border-red-400">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  /* Empty State */
  const noResults = hasNoResults(
    activeTab,
    artistViewMode,
    playlistViewMode,
    songResults,
    artistResults,
    albumResults,
    playlistResults
  );
  if (!isLoading && noResults && hasSearched) {
    return (
      <EmptyState
        type={getEmptyStateType(activeTab, artistViewMode, playlistViewMode)}
        hasSearched={hasSearched}
      />
    );
  }

  /* Initial state */
  if (!isLoading && !hasSearched && activeTab !== "playlist") {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <MagnifyingGlassIcon className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Search Music</h3>
        <p className="text-gray-500 text-center">
          {activeTab === "search"
            ? "Search for artists and songs to add to the queue"
            : artistViewMode === "artists"
              ? "Search for artists to browse their songs"
              : `Browse songs by ${selectedArtist?.name || "this artist"}`}
        </p>
      </div>
    );
  }

  return null;
}
