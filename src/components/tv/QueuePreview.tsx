"use client";

import { QueueItem } from "@/types";
import { XMarkIcon, UserIcon, PlayIcon } from "@heroicons/react/24/outline";
import { LyricsIndicator } from "@/components/LyricsIndicator";

interface QueuePreviewProps {
  queue: QueueItem[];
  currentSong: QueueItem | null;
  onClose: () => void;
}

export function QueuePreview({
  queue,
  currentSong,
  onClose,
}: QueuePreviewProps) {
  const pendingQueue = queue.filter((item) => item.status === "pending");

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const totalDuration = pendingQueue.reduce(
    (total, item) => total + item.mediaItem.duration,
    0,
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-4xl w-full mx-8 max-h-[80vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Song Queue</h2>
            <p className="text-gray-400">
              {pendingQueue.length} song{pendingQueue.length !== 1 ? "s" : ""} •
              Total time: {formatDuration(totalDuration)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <XMarkIcon className="w-8 h-8 text-gray-400" />
          </button>
        </div>

        {/* Current Song */}
        {currentSong && (
          <div className="mb-6 p-4 bg-purple-900 bg-opacity-30 rounded-lg border border-purple-700">
            <div className="flex items-center mb-2">
              <PlayIcon className="w-5 h-5 text-purple-400 mr-2" />
              <span className="text-purple-400 font-medium">Now Playing</span>
            </div>
            <div className="ml-7">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl font-semibold text-white">
                  {currentSong.mediaItem.title}
                </h3>
                <LyricsIndicator
                  song={currentSong.mediaItem}
                  size="md"
                  variant="badge"
                />
              </div>
              <p className="text-gray-300">{currentSong.mediaItem.artist}</p>
              <div className="flex items-center mt-1 text-sm text-gray-400">
                <UserIcon className="w-3 h-3 mr-1" />
                {currentSong.addedBy} •{" "}
                {formatDuration(currentSong.mediaItem.duration)}
              </div>
            </div>
          </div>
        )}

        {/* Queue List */}
        <div className="overflow-y-auto max-h-96">
          {pendingQueue.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-xl">Queue is empty</div>
              <p className="text-gray-600 mt-2">
                Waiting for songs to be added...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingQueue.map((song, index) => (
                <div
                  key={song.id}
                  className="flex items-center p-4 bg-gray-800 bg-opacity-50 rounded-lg hover:bg-opacity-70 transition-colors"
                >
                  {/* Position */}
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-medium">{index + 1}</span>
                  </div>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-lg font-medium text-white truncate">
                        {song.mediaItem.title}
                      </h4>
                      <LyricsIndicator
                        song={song.mediaItem}
                        size="sm"
                        variant="badge"
                      />
                    </div>
                    <p className="text-gray-300 truncate">
                      {song.mediaItem.artist}
                      {song.mediaItem.album && ` • ${song.mediaItem.album}`}
                    </p>
                    <div className="flex items-center mt-1 text-sm text-gray-400">
                      <UserIcon className="w-3 h-3 mr-1" />
                      {song.addedBy}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex-shrink-0 text-gray-400 text-sm">
                    {formatDuration(song.mediaItem.duration)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Press Q to toggle queue • ESC to close</span>
            <span>Auto-hide in 10 seconds</span>
          </div>
        </div>
      </div>
    </div>
  );
}
