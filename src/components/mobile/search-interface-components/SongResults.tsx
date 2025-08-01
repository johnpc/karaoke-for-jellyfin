"use client";

import {
  MusicalNoteIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { MediaItem } from "@/types";
import { LyricsIndicator } from "@/components/LyricsIndicator";

interface SongResultsProps {
  songs: MediaItem[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onAddSong: (song: MediaItem) => void;
  addingSongId: string | null;
  isConnected: boolean;
  showHeader?: boolean;
  testId?: string;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function SongResults({
  songs,
  isCollapsed = false,
  onToggleCollapse,
  onAddSong,
  addingSongId,
  isConnected,
  showHeader = true,
  testId = "song-results",
}: SongResultsProps) {
  if (songs.length === 0) return null;

  const songList = (
    <div className="divide-y divide-gray-200">
      {songs.map(song => (
        <div
          key={song.id}
          data-testid="song-item"
          className="p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-medium text-gray-900 truncate">
                  {song.title}
                </h3>
                <LyricsIndicator song={song} size="sm" variant="badge" />
              </div>
              <p className="text-sm text-gray-600 truncate">
                {song.artist}
                {song.album && ` • ${song.album}`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDuration(song.duration)}
              </p>
            </div>

            <button
              data-testid="add-song-button"
              onClick={() => onAddSong(song)}
              disabled={!isConnected || addingSongId === song.id}
              className="ml-4 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Add to queue"
            >
              {addingSongId === song.id ? (
                <div
                  data-testid="add-song-loading"
                  className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"
                ></div>
              ) : (
                <PlusIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  // If no header is requested, just return the song list
  if (!showHeader) {
    return (
      <div data-testid={testId} className="divide-y divide-gray-200">
        {songList}
      </div>
    );
  }

  // Return with collapsible header
  return (
    <div data-testid={testId}>
      <button
        onClick={onToggleCollapse}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center">
          <MusicalNoteIcon className="w-5 h-5 text-gray-600 mr-2" />
          <span className="font-medium text-gray-900">
            Songs ({songs.length})
          </span>
        </div>
        {isCollapsed ? (
          <ChevronDownIcon className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronUpIcon className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {!isCollapsed && songList}
    </div>
  );
}
