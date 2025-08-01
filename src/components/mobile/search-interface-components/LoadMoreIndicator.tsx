"use client";

interface LoadMoreIndicatorProps {
  isLoadingMore: boolean;
  activeTab: "search" | "playlist";
  artistViewMode: "artists" | "songs";
  playlistViewMode: "playlists" | "songs";
}

function getLoadingMessage(
  activeTab: "search" | "playlist",
  artistViewMode: "artists" | "songs",
  playlistViewMode: "playlists" | "songs"
): string {
  if (activeTab === "search" && artistViewMode === "artists") {
    return "Loading more results...";
  }
  if (activeTab === "playlist" && playlistViewMode === "playlists") {
    return "Loading more playlists...";
  }
  return "Loading more songs...";
}

export function LoadMoreIndicator({
  isLoadingMore,
  activeTab,
  artistViewMode,
  playlistViewMode,
}: LoadMoreIndicatorProps) {
  if (!isLoadingMore) return null;

  return (
    <div className="flex items-center justify-center py-6">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
      <span className="ml-3 text-gray-600 text-sm">
        {getLoadingMessage(activeTab, artistViewMode, playlistViewMode)}
      </span>
    </div>
  );
}
