"use client";

import { PlayIcon, UserIcon } from "@heroicons/react/24/outline";
import { QueueItem } from "@/types";

interface NowPlayingProps {
  currentSong: QueueItem;
  userName: string;
}

export function NowPlaying({ currentSong, userName }: NowPlayingProps) {
  return (
    <div
      data-testid="now-playing"
      className="bg-purple-50 border-b border-purple-200 p-4"
    >
      <div className="flex items-center mb-2">
        <PlayIcon className="w-5 h-5 text-purple-600 mr-2" />
        <span className="text-sm font-medium text-purple-800">Now Playing</span>
      </div>
      <div className="ml-7">
        <h3 className="font-medium text-gray-900">
          {currentSong.mediaItem.title}
        </h3>
        <p className="text-sm text-gray-600">{currentSong.mediaItem.artist}</p>
        <div className="flex items-center mt-1 text-xs text-gray-500">
          <UserIcon className="w-3 h-3 mr-1" />
          Added by{" "}
          {currentSong.addedBy === userName ? "You" : currentSong.addedBy}
        </div>
      </div>
    </div>
  );
}
