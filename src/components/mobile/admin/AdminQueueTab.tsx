"use client";

import { QueueItem } from "@/types";
import { QueueListIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface AdminQueueTabProps {
  pendingQueue: QueueItem[];
  onRemoveSong?: (queueItemId: string) => void;
  onReorderQueue?: (queueItemId: string, newPosition: number) => void;
}

export function AdminQueueTab({
  pendingQueue,
  onRemoveSong,
}: AdminQueueTabProps) {
  return (
    <div data-testid="queue-management" className="space-y-4">
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h3 className="text-sm font-medium text-gray-500 mb-3">
          <span data-testid="queue-status">
            Queue (<span data-testid="queue-count">{pendingQueue.length}</span>{" "}
            songs)
          </span>
        </h3>

        {pendingQueue.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <QueueListIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No songs in queue</p>
          </div>
        ) : (
          <div data-testid="admin-queue-list" className="space-y-2">
            {pendingQueue.map((item, index) => (
              <div
                key={item.id}
                data-testid="admin-queue-item"
                className="flex items-center p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-xs font-medium text-purple-600">
                    {index + 1}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    data-testid="song-title"
                    className="font-medium text-gray-900 truncate"
                  >
                    {item.mediaItem.title}
                  </p>
                  <p
                    data-testid="song-artist"
                    className="text-sm text-gray-600 truncate"
                  >
                    {item.mediaItem.artist}
                  </p>
                  <p data-testid="added-by" className="text-xs text-gray-500">
                    Added by {item.addedBy}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-500">
                    {Math.floor(item.mediaItem.duration / 60)}:
                    {String(item.mediaItem.duration % 60).padStart(2, "0")}
                  </div>
                  {onRemoveSong && (
                    <button
                      data-testid="admin-remove-song"
                      onClick={() => onRemoveSong(item.id)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Remove song"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
