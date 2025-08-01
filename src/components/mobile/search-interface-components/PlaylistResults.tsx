"use client";

import { MusicalNoteIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Playlist } from "@/types";

interface PlaylistResultsProps {
  playlists: Playlist[];
  onPlaylistSelect: (playlist: Playlist) => void;
}

export function PlaylistResults({
  playlists,
  onPlaylistSelect,
}: PlaylistResultsProps) {
  if (playlists.length === 0) return null;

  return (
    <div className="divide-y divide-gray-200">
      {playlists.map(playlist => (
        <div
          key={playlist.id}
          data-testid="playlist-item"
          className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => onPlaylistSelect(playlist)}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              {playlist.imageUrl ? (
                <img
                  src={playlist.imageUrl}
                  alt={playlist.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <MusicalNoteIcon className="w-6 h-6 text-purple-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-medium text-gray-900 truncate">
                {playlist.name}
              </h3>
              <p className="text-sm text-gray-600">
                {playlist.trackCount
                  ? `${playlist.trackCount} songs`
                  : "Playlist"}
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <ArrowLeftIcon className="w-4 h-4 text-white transform rotate-180" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
