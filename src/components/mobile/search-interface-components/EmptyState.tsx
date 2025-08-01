"use client";

import {
  MagnifyingGlassIcon,
  MusicalNoteIcon,
} from "@heroicons/react/24/outline";

interface EmptyStateProps {
  type: "search" | "playlist" | "songs";
  hasSearched: boolean;
}

export function EmptyState({ type, hasSearched }: EmptyStateProps) {
  if (!hasSearched) return null;

  const getIcon = () => {
    switch (type) {
      case "search":
        return <MagnifyingGlassIcon className="w-12 h-12 text-gray-400 mb-4" />;
      case "playlist":
        return <MusicalNoteIcon className="w-12 h-12 text-gray-400 mb-4" />;
      case "songs":
        return <MusicalNoteIcon className="w-12 h-12 text-gray-400 mb-4" />;
      default:
        return <MagnifyingGlassIcon className="w-12 h-12 text-gray-400 mb-4" />;
    }
  };

  const getMessage = () => {
    switch (type) {
      case "search":
        return {
          title: "No results found",
          subtitle: "Try searching for a different artist, song, or album",
        };
      case "playlist":
        return {
          title: "No playlists found",
          subtitle: "Try a different search term",
        };
      case "songs":
        return {
          title: "No songs found",
          subtitle: "This collection appears to be empty",
        };
      default:
        return {
          title: "No results found",
          subtitle: "Try a different search term",
        };
    }
  };

  const { title, subtitle } = getMessage();

  return (
    <div
      data-testid="no-results"
      className="flex flex-col items-center justify-center py-12 px-4"
    >
      {getIcon()}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-center">{subtitle}</p>
    </div>
  );
}
