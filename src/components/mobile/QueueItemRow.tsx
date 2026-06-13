"use client";

import { TrashIcon, UserIcon } from "@heroicons/react/24/outline";
import { QueueItem } from "@/types";
import { LyricsIndicator } from "@/components/LyricsIndicator";
import { formatTime } from "@/utils/formatTime";

interface QueueItemRowProps {
  queueItem: QueueItem;
  position: number | null;
  index: number;
  userName: string;
  canRemove: boolean;
  onRemove: (id: string) => void;
}

export function QueueItemRow({
  queueItem,
  position,
  index,
  userName,
  canRemove,
  onRemove,
}: QueueItemRowProps) {
  const isUserSong = queueItem.addedBy === userName;

  return (
    <div
      data-testid="queue-item"
      className={`p-4 ${isUserSong ? "bg-blue-50" : "hover:bg-gray-50"} transition-colors`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0">
          {/* Drag Handle */}
          <div
            data-testid="drag-handle"
            className="flex-shrink-0 mr-2 cursor-move"
          >
            <div className="w-4 h-4 flex flex-col justify-center">
              <div className="w-1 h-1 bg-gray-400 rounded-full mb-0.5"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full mb-0.5"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            </div>
          </div>

          {/* Position Number */}
          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-sm font-medium text-gray-600">
              {position || index + 1}
            </span>
          </div>

          {/* Song Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-medium text-gray-900 truncate">
                {queueItem.mediaItem.title}
              </h3>
              <LyricsIndicator
                song={queueItem.mediaItem}
                size="sm"
                variant="badge"
              />
            </div>
            <p className="text-sm text-gray-600 truncate">
              {queueItem.mediaItem.artist}
              {queueItem.mediaItem.album && ` • ${queueItem.mediaItem.album}`}
            </p>
            <div className="flex items-center mt-1 text-xs text-gray-500">
              <UserIcon className="w-3 h-3 mr-1" />
              {isUserSong ? "You" : queueItem.addedBy}
              <span className="mx-2">&bull;</span>
              {formatTime(queueItem.mediaItem.duration)}
            </div>
          </div>
        </div>

        {/* Remove Button */}
        {canRemove && (
          <button
            data-testid="remove-song-button"
            onClick={() => onRemove(queueItem.id)}
            className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Remove from queue"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* User's Song Indicator */}
      {isUserSong && (
        <div className="mt-2 text-xs text-blue-600 font-medium">Your song</div>
      )}
    </div>
  );
}
