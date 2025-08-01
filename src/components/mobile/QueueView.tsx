"use client";

import { TrashIcon, PlayIcon, UserIcon } from "@heroicons/react/24/outline";
import { QueueItem, KaraokeSession, ConnectedUser } from "@/types";
import { LyricsIndicator } from "@/components/LyricsIndicator";

interface QueueViewProps {
  queue: QueueItem[];
  currentSong: QueueItem | null;
  onRemoveSong: (queueItemId: string) => void;
  userName: string;
  session: KaraokeSession | null;
}

export function QueueView({
  queue,
  currentSong,
  onRemoveSong,
  userName,
  session,
}: QueueViewProps) {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getUserSongs = () => {
    return queue.filter(item => item.addedBy === userName);
  };

  const getQueuePosition = (queueItem: QueueItem) => {
    const pendingSongs = queue.filter(item => item.status === "pending");
    const position = pendingSongs.findIndex(item => item.id === queueItem.id);
    return position >= 0 ? position + 1 : null;
  };

  const canRemoveSong = (queueItem: QueueItem) => {
    // User can remove their own songs, or if they're the host
    const isOwner = queueItem.addedBy === userName;
    const isHost = session?.connectedUsers.find(
      u => u.name === userName
    )?.isHost;
    return isOwner || isHost;
  };

  const userSongs = getUserSongs();
  const totalEstimatedTime = queue
    .filter(item => item.status === "pending")
    .reduce((total, item) => total + item.mediaItem.duration, 0);

  const filterUniqueUsers = (
    user: ConnectedUser,
    index: number,
    array: ConnectedUser[]
  ) => array.findIndex(u => u.name === user.name) === index;

  return (
    <div className="flex flex-col h-full">
      {/* Queue Stats */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Queue</h2>
          <div className="text-sm text-gray-600">
            {queue.filter(item => item.status === "pending").length} songs
          </div>
        </div>

        {totalEstimatedTime > 0 && (
          <div className="text-sm text-gray-600 mb-2">
            Estimated time: {formatDuration(totalEstimatedTime)}
          </div>
        )}

        {userSongs.length > 0 && (
          <div className="text-sm text-purple-600">
            You have {userSongs.length} song{userSongs.length !== 1 ? "s" : ""}{" "}
            in queue
          </div>
        )}
      </div>

      {/* Current Song */}
      {currentSong && (
        <div className="bg-purple-50 border-b border-purple-200 p-4">
          <div className="flex items-center mb-2">
            <PlayIcon className="w-5 h-5 text-purple-600 mr-2" />
            <span className="text-sm font-medium text-purple-800">
              Now Playing
            </span>
          </div>
          <div className="ml-7">
            <h3 className="font-medium text-gray-900">
              {currentSong.mediaItem.title}
            </h3>
            <p className="text-sm text-gray-600">
              {currentSong.mediaItem.artist}
            </p>
            <div className="flex items-center mt-1 text-xs text-gray-500">
              <UserIcon className="w-3 h-3 mr-1" />
              Added by{" "}
              {currentSong.addedBy === userName ? "You" : currentSong.addedBy}
            </div>
          </div>
        </div>
      )}

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto">
        {queue.filter(item => item.status === "pending").length === 0 ? (
          <div
            data-testid="empty-queue"
            className="flex flex-col items-center justify-center py-12 px-4"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <PlayIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Queue is empty
            </h3>
            <p className="text-gray-500 text-center">
              Search for songs to add them to the queue
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {queue
              .filter(item => item.status === "pending")
              .map((queueItem, index) => {
                const position = getQueuePosition(queueItem);
                const isUserSong = queueItem.addedBy === userName;

                return (
                  <div
                    key={queueItem.id}
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
                            {queueItem.mediaItem.album &&
                              ` • ${queueItem.mediaItem.album}`}
                          </p>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <UserIcon className="w-3 h-3 mr-1" />
                            {isUserSong ? "You" : queueItem.addedBy}
                            <span className="mx-2">•</span>
                            {formatDuration(queueItem.mediaItem.duration)}
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      {canRemoveSong(queueItem) && (
                        <button
                          data-testid="remove-song-button"
                          onClick={() => onRemoveSong(queueItem.id)}
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Remove from queue"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* User's Song Indicator */}
                    {isUserSong && (
                      <div className="mt-2 text-xs text-blue-600 font-medium">
                        Your song
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Connected Users */}
      {session &&
        session.connectedUsers.filter(filterUniqueUsers).length > 0 && (
          <div className="bg-gray-50 border-t border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-2">
              Connected ({session.connectedUsers.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {session.connectedUsers.filter(filterUniqueUsers).map(user => (
                <div
                  key={user.id}
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    user.name === userName
                      ? "bg-purple-100 text-purple-800"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  <UserIcon className="w-3 h-3 mr-1" />
                  {user.name === userName ? "You" : user.name}
                  {user.isHost && (
                    <span className="ml-1 text-xs opacity-75">(Host)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
