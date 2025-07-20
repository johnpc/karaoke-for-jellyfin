"use client";

import { QueueItem } from "@/types";
import { UserIcon, ClockIcon, QueueListIcon } from "@heroicons/react/24/outline";

interface NextUpSidebarProps {
  queue: QueueItem[];
  currentSong: QueueItem | null;
}

export function NextUpSidebar({ queue, currentSong }: NextUpSidebarProps) {
  const pendingQueue = queue.filter((item) => item.status === "pending");
  const nextSong = pendingQueue[0]; // Only get the first song
  const remainingCount = pendingQueue.length - 1; // Count of songs after the next one

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (!nextSong) {
    return (
      <div className="fixed left-4 top-4 w-80 bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 z-40">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <ClockIcon className="w-5 h-5 mr-2 text-blue-400" />
          Next Up
        </h3>
        <div className="text-center py-6">
          <div className="text-gray-500 text-base">Queue is empty</div>
          <p className="text-gray-600 mt-2 text-sm">
            Add songs to get started!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed left-4 top-4 w-80 bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 z-40">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center">
        <ClockIcon className="w-5 h-5 mr-2 text-blue-400" />
        Next Up
      </h3>

      {/* Next Song Card */}
      <div className="bg-blue-900 bg-opacity-40 border border-blue-700 rounded-xl p-4 shadow-lg">
        {/* Up Next Indicator */}
        <div className="flex items-center mb-3">
          <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
          <span className="text-blue-400 font-medium text-sm">Coming Up Next</span>
        </div>

        {/* Song Information */}
        <div className="space-y-2">
          {/* Song Title */}
          <h4 className="text-white font-semibold text-lg leading-tight">
            {nextSong.mediaItem.title}
          </h4>

          {/* Artist */}
          <p className="text-blue-200 text-base">
            {nextSong.mediaItem.artist}
          </p>

          {/* Album (if available) */}
          {nextSong.mediaItem.album && (
            <p className="text-blue-300 text-sm opacity-80">
              {nextSong.mediaItem.album}
            </p>
          )}

          {/* Added by and Duration */}
          <div className="flex items-center justify-between pt-2 border-t border-blue-800 border-opacity-50">
            <div className="flex items-center text-blue-300 text-sm">
              <UserIcon className="w-4 h-4 mr-1.5" />
              <span>Added by {nextSong.addedBy}</span>
            </div>
            <div className="text-blue-300 text-sm font-medium">
              {formatDuration(nextSong.mediaItem.duration)}
            </div>
          </div>
        </div>
      </div>

      {/* Queue Summary */}
      {remainingCount > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-400">
              <QueueListIcon className="w-4 h-4 mr-1.5" />
              <span>
                {remainingCount} more song{remainingCount !== 1 ? "s" : ""} in queue
              </span>
            </div>
            <span className="text-gray-500 text-xs">Press Q for full queue</span>
          </div>
        </div>
      )}
    </div>
  );
}
