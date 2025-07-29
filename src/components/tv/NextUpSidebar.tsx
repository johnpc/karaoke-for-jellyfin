"use client";

import { QueueItem } from "@/types";
import { ClockIcon } from "@heroicons/react/24/outline";
import { LyricsIndicator } from "@/components/LyricsIndicator";

interface NextUpSidebarProps {
  queue: QueueItem[];
  currentSong: QueueItem | null;
}

export function NextUpSidebar({ queue, currentSong }: NextUpSidebarProps) {
  const pendingQueue = queue.filter(item => item.status === "pending");
  const nextSong = pendingQueue[0];

  if (!nextSong) {
    return null; // Don't show anything when queue is empty
  }

  return (
    <div className="fixed left-4 top-4 bg-gray-900 bg-opacity-80 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-700 z-40">
      <div className="flex items-center space-x-2 text-sm">
        <ClockIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-white font-medium truncate">
              {nextSong.mediaItem.title}
            </div>
            <LyricsIndicator
              song={nextSong.mediaItem}
              size="sm"
              variant="badge"
            />
          </div>
          <div className="text-gray-400 text-xs truncate">
            {nextSong.mediaItem.artist} • {nextSong.addedBy}
          </div>
        </div>
      </div>
    </div>
  );
}
