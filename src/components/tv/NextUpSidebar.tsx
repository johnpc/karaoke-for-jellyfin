"use client";

import { QueueItem } from "@/types";
import { UserIcon, ClockIcon } from "@heroicons/react/24/outline";

interface NextUpSidebarProps {
  queue: QueueItem[];
  currentSong: QueueItem | null;
}

export function NextUpSidebar({ queue, currentSong }: NextUpSidebarProps) {
  const pendingQueue = queue.filter((item) => item.status === "pending");
  const nextUpQueue = pendingQueue.slice(0, 5); // Show next 5 songs

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (nextUpQueue.length === 0) {
    return (
      <div className="fixed left-4 top-4 w-72 bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-2xl p-4 border border-gray-700 z-40">
        <h3 className="text-lg font-bold text-white mb-3 flex items-center">
          <ClockIcon className="w-4 h-4 mr-2 text-blue-400" />
          Next Up
        </h3>
        <div className="text-center py-4">
          <div className="text-gray-500 text-sm">Queue is empty</div>
          <p className="text-gray-600 mt-1 text-xs">
            Add songs to get started!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed left-4 top-4 w-72 bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-2xl p-4 border border-gray-700 z-40">
      <h3 className="text-lg font-bold text-white mb-3 flex items-center">
        <ClockIcon className="w-4 h-4 mr-2 text-blue-400" />
        Next Up
      </h3>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {nextUpQueue.map((song, index) => (
          <div
            key={song.id}
            className={`p-2 rounded-lg transition-all duration-300 ${
              index === 0
                ? "bg-blue-900 bg-opacity-40 border border-blue-700 shadow-lg"
                : "bg-gray-800 bg-opacity-50 hover:bg-opacity-70"
            }`}
          >
            {/* Position indicator */}
            <div className="flex items-start space-x-2">
              <div
                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  index === 0
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                {index + 1}
              </div>

              <div className="flex-1 min-w-0">
                {/* Song title */}
                <h4
                  className={`text-sm font-medium truncate ${
                    index === 0 ? "text-blue-100" : "text-white"
                  }`}
                >
                  {song.mediaItem.title}
                </h4>

                {/* Artist */}
                <p
                  className={`text-xs truncate ${
                    index === 0 ? "text-blue-200" : "text-gray-300"
                  }`}
                >
                  {song.mediaItem.artist}
                </p>

                {/* Added by and duration */}
                <div
                  className={`flex items-center justify-between mt-1 text-xs ${
                    index === 0 ? "text-blue-300" : "text-gray-400"
                  }`}
                >
                  <div className="flex items-center min-w-0">
                    <UserIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{song.addedBy}</span>
                  </div>
                  <span className="ml-2 flex-shrink-0">
                    {formatDuration(song.mediaItem.duration)}
                  </span>
                </div>
              </div>
            </div>

            {/* "Up Next" indicator for first item */}
            {index === 0 && (
              <div className="mt-1 text-xs text-blue-400 font-medium flex items-center">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1 animate-pulse"></div>
                Up Next
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show more indicator */}
      {pendingQueue.length > 5 && (
        <div className="mt-3 pt-2 border-t border-gray-700">
          <p className="text-center text-xs text-gray-400">
            +{pendingQueue.length - 5} more song
            {pendingQueue.length - 5 !== 1 ? "s" : ""} in queue
          </p>
          <p className="text-center text-xs text-gray-500 mt-1">
            Press Q to see full queue
          </p>
        </div>
      )}
    </div>
  );
}
