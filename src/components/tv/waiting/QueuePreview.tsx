"use client";

import { QueueItem } from "@/types";
import { QueueListIcon, UserIcon } from "@heroicons/react/24/outline";

interface QueuePreviewProps {
  nextSongs: QueueItem[];
  totalSongs: number;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function QueuePreview({ nextSongs, totalSongs }: QueuePreviewProps) {
  if (nextSongs.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center justify-center mb-6">
        <QueueListIcon className="w-8 h-8 text-blue-400 mr-3" />
        <h3 className="text-2xl font-semibold text-white">Coming Up Next</h3>
      </div>

      <div className="space-y-4">
        {nextSongs.map((song, index) => (
          <div
            key={song.id}
            className="bg-gray-900 bg-opacity-50 rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-xl font-bold text-white">
                    {index + 1}
                  </span>
                </div>
                <div className="text-left">
                  <h4 className="text-2xl font-semibold text-white">
                    {song.mediaItem.title}
                  </h4>
                  <p className="text-lg text-gray-300">
                    {song.mediaItem.artist}
                  </p>
                  {song.mediaItem.album && (
                    <p className="text-sm text-gray-400">
                      {song.mediaItem.album}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg text-gray-400 mb-1">
                  {formatDuration(song.mediaItem.duration)}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <UserIcon className="w-4 h-4 mr-1" />
                  {song.addedBy}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalSongs > 3 && (
        <div className="mt-4 text-lg text-gray-400">
          + {totalSongs - 3} more song{totalSongs - 3 !== 1 ? "s" : ""} in queue
        </div>
      )}
    </div>
  );
}
