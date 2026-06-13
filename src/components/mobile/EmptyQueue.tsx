"use client";

import { PlayIcon } from "@heroicons/react/24/outline";

export function EmptyQueue() {
  return (
    <div
      data-testid="empty-queue"
      className="flex flex-col items-center justify-center py-12 px-4"
    >
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <PlayIcon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Queue is empty</h3>
      <p className="text-gray-500 text-center">
        Search for songs to add them to the queue
      </p>
    </div>
  );
}
