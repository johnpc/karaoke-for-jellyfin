"use client";

interface LoadMoreButtonProps {
  hasSearched: boolean;
  hasMoreResults: boolean;
  isLoadingMore: boolean;
  isLoading: boolean;
  activeTab: "search" | "playlist";
  artistViewMode: "artists" | "songs";
  playlistViewMode: "playlists" | "songs";
  artistResults: any[];
  albumResults: any[];
  songResults: any[];
  playlistResults: any[];
  onLoadMore: () => void;
}

function shouldShowLoadMoreButton(props: LoadMoreButtonProps): boolean {
  const {
    hasSearched,
    hasMoreResults,
    isLoadingMore,
    isLoading,
    activeTab,
    artistViewMode,
    playlistViewMode,
    artistResults,
    albumResults,
    songResults,
    playlistResults,
  } = props;

  if (!hasSearched || !hasMoreResults || isLoadingMore || isLoading) {
    return false;
  }

  // Search tab with artists view
  if (activeTab === "search" && artistViewMode === "artists") {
    return (
      artistResults.length > 0 ||
      albumResults.length > 0 ||
      songResults.length > 0
    );
  }

  // Playlist tab with playlists view
  if (activeTab === "playlist" && playlistViewMode === "playlists") {
    return playlistResults.length > 0;
  }

  // Songs view (either search/artist songs or playlist songs)
  if (
    (activeTab === "search" && artistViewMode === "songs") ||
    (activeTab === "playlist" && playlistViewMode === "songs")
  ) {
    return songResults.length > 0;
  }

  return false;
}

export function LoadMoreButton(props: LoadMoreButtonProps) {
  if (!shouldShowLoadMoreButton(props)) return null;

  return (
    <div className="flex items-center justify-center py-6">
      <button
        onClick={props.onLoadMore}
        className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
      >
        Load More
      </button>
    </div>
  );
}
