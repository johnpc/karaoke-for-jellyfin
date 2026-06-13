"use client";

import { QueueItem, KaraokeSession } from "@/types";
import { formatTime } from "@/utils/formatTime";
import { NowPlaying } from "@/components/mobile/NowPlaying";
import { QueueItemRow } from "@/components/mobile/QueueItemRow";
import { ConnectedUsers } from "@/components/mobile/ConnectedUsers";
import { EmptyQueue } from "@/components/mobile/EmptyQueue";

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
  const pendingSongs = queue.filter(item => item.status === "pending");
  const userSongs = queue.filter(item => item.addedBy === userName);
  const totalEstimatedTime = pendingSongs.reduce(
    (total, item) => total + item.mediaItem.duration,
    0
  );

  const getQueuePosition = (queueItem: QueueItem): number | null => {
    const idx = pendingSongs.findIndex(item => item.id === queueItem.id);
    return idx >= 0 ? idx + 1 : null;
  };

  const canRemoveSong = (queueItem: QueueItem): boolean => {
    const isOwner = queueItem.addedBy === userName;
    const isHost = session?.connectedUsers.find(
      u => u.name === userName
    )?.isHost;
    return isOwner || !!isHost;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Queue Stats */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Queue</h2>
          <div className="text-sm text-gray-600">
            {pendingSongs.length} songs
          </div>
        </div>

        {totalEstimatedTime > 0 && (
          <div className="text-sm text-gray-600 mb-2">
            Estimated time: {formatTime(totalEstimatedTime)}
          </div>
        )}

        {userSongs.length > 0 && (
          <div className="text-sm text-purple-600">
            You have {userSongs.length} song{userSongs.length !== 1 ? "s" : ""}{" "}
            in queue
          </div>
        )}
      </div>

      {currentSong && (
        <NowPlaying currentSong={currentSong} userName={userName} />
      )}

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto">
        {pendingSongs.length === 0 ? (
          <EmptyQueue />
        ) : (
          <div className="divide-y divide-gray-200">
            {pendingSongs.map((queueItem, index) => (
              <QueueItemRow
                key={queueItem.id}
                queueItem={queueItem}
                position={getQueuePosition(queueItem)}
                index={index}
                userName={userName}
                canRemove={canRemoveSong(queueItem)}
                onRemove={onRemoveSong}
              />
            ))}
          </div>
        )}
      </div>

      {session && (
        <ConnectedUsers users={session.connectedUsers} userName={userName} />
      )}
    </div>
  );
}
