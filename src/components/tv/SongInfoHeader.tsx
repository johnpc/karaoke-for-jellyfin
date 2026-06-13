"use client";

import { QueueItem } from "@/types";
import { MusicalNoteIcon, UserIcon } from "@heroicons/react/24/outline";

interface SongInfoHeaderProps {
  song: QueueItem;
}

export function SongInfoHeader({ song }: SongInfoHeaderProps) {
  return (
    <div className="text-center mb-4 z-10 flex-shrink-0">
      <div className="flex items-center justify-center mb-3">
        <MusicalNoteIcon className="w-5 h-5 text-purple-400 mr-2 opacity-70" />
        <span className="text-lg text-purple-400 font-medium opacity-70">
          Now Playing
        </span>
      </div>

      <h1
        data-testid="current-song-title"
        className="text-3xl font-semibold mb-2 text-white leading-tight"
      >
        {song.mediaItem.title}
      </h1>

      <p
        data-testid="current-song-artist"
        className="text-xl text-gray-400 mb-1"
      >
        {song.mediaItem.artist}
      </p>

      {song.mediaItem.album && (
        <p className="text-sm text-gray-500 opacity-60">
          {song.mediaItem.album}
        </p>
      )}

      <div className="flex items-center justify-center mt-2 text-sm text-gray-500">
        <UserIcon className="w-4 h-4 mr-1 opacity-60" />
        <span className="opacity-60">Added by {song.addedBy}</span>
      </div>
    </div>
  );
}
