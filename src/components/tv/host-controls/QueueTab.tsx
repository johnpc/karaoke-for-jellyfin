"use client";

import { QueueItem } from "@/types";
import {
  TrashIcon,
  Bars3Icon,
  QueueListIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

interface QueueTabProps {
  pendingQueue: QueueItem[];
  onRemoveSong?: (queueItemId: string) => void;
  onReorderQueue?: (queueItemId: string, newPosition: number) => void;
}

export function QueueTab({
  pendingQueue,
  onRemoveSong,
  onReorderQueue,
}: QueueTabProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, queueItemId: string) => {
    setDraggedItem(queueItemId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, newIndex: number) => {
    e.preventDefault();
    if (draggedItem && onReorderQueue) {
      onReorderQueue(draggedItem, newIndex);
    }
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Queue Management</h3>
        <div className="text-sm text-gray-400">
          Drag songs to reorder • Click trash to remove
        </div>
      </div>

      {pendingQueue.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <QueueListIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No songs in queue</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {pendingQueue.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={e => handleDragStart(e, item.id)}
              onDragOver={e => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, index)}
              className={`flex items-center p-3 rounded-lg border transition-all cursor-move ${
                dragOverIndex === index
                  ? "border-purple-500 bg-purple-900 bg-opacity-20"
                  : "border-gray-700 bg-gray-800 hover:bg-gray-750"
              } ${draggedItem === item.id ? "opacity-50" : ""}`}
            >
              <div className="flex items-center mr-3 text-gray-400">
                <Bars3Icon className="w-5 h-5" />
                <span className="ml-2 text-sm font-mono">{index + 1}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {item.mediaItem.title}
                </p>
                <p className="text-gray-400 text-sm truncate">
                  {item.mediaItem.artist}
                </p>
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <UserIcon className="w-3 h-3 mr-1" />
                  {item.addedBy}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="text-gray-400 text-sm">
                  {Math.floor(item.mediaItem.duration / 60)}:
                  {String(item.mediaItem.duration % 60).padStart(2, "0")}
                </div>
                {onRemoveSong && (
                  <button
                    onClick={() => onRemoveSong(item.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-20 rounded-full transition-colors"
                    title="Remove from queue"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
