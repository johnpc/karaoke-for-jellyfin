"use client";

import { SongHistoryEntry } from "@/hooks/useSongHistory";
import { MediaItem } from "@/types";

interface MySongsProps {
  favorites: SongHistoryEntry[];
  recentHistory: SongHistoryEntry[];
  onToggleFavorite: (jellyfinId: string) => void;
  onAddSong: (mediaItem: MediaItem) => void;
}

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString();
}

export function MySongs({
  favorites,
  recentHistory,
  onToggleFavorite,
  onAddSong,
}: MySongsProps) {
  if (favorites.length === 0 && recentHistory.length === 0) {
    return (
      <div
        data-testid="my-songs-empty"
        className="flex flex-col items-center justify-center py-16 px-4 text-center"
      >
        <p className="text-gray-500 text-lg">No songs yet</p>
        <p className="text-gray-400 text-sm mt-2">
          Songs you add to the queue will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {favorites.length > 0 && (
        <section data-testid="favorites-section">
          <h2 className="px-4 py-2 text-sm font-semibold text-gray-500 uppercase bg-gray-100">
            Favorites
          </h2>
          {favorites.map(entry => (
            <SongRow
              key={entry.mediaItem.jellyfinId}
              entry={entry}
              onToggleFavorite={onToggleFavorite}
              onAddSong={onAddSong}
            />
          ))}
        </section>
      )}

      {recentHistory.length > 0 && (
        <section data-testid="history-section">
          <h2 className="px-4 py-2 text-sm font-semibold text-gray-500 uppercase bg-gray-100">
            History
          </h2>
          {recentHistory.map(entry => (
            <SongRow
              key={entry.mediaItem.jellyfinId}
              entry={entry}
              onToggleFavorite={onToggleFavorite}
              onAddSong={onAddSong}
            />
          ))}
        </section>
      )}
    </div>
  );
}

interface SongRowProps {
  entry: SongHistoryEntry;
  onToggleFavorite: (jellyfinId: string) => void;
  onAddSong: (mediaItem: MediaItem) => void;
}

function SongRow({ entry, onToggleFavorite, onAddSong }: SongRowProps) {
  return (
    <div
      data-testid="song-history-item"
      className="flex items-center px-4 py-3 border-b border-gray-100"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {entry.mediaItem.title}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {entry.mediaItem.artist}
        </p>
        <p
          data-testid="last-sung-time"
          className="text-xs text-gray-400 mt-0.5"
        >
          {formatRelativeTime(entry.lastSungAt)}
        </p>
      </div>
      <button
        data-testid={`favorite-btn-${entry.mediaItem.jellyfinId}`}
        onClick={() => onToggleFavorite(entry.mediaItem.jellyfinId)}
        className="p-2 text-xl"
        aria-label={
          entry.isFavorite ? "Remove from favorites" : "Add to favorites"
        }
      >
        {entry.isFavorite ? "⭐" : "☆"}
      </button>
      <button
        data-testid={`requeue-btn-${entry.mediaItem.jellyfinId}`}
        onClick={() => onAddSong(entry.mediaItem)}
        className="p-2 ml-1 bg-purple-600 text-white text-xs rounded-lg px-3"
        aria-label={`Add ${entry.mediaItem.title} to queue`}
      >
        + Queue
      </button>
    </div>
  );
}
