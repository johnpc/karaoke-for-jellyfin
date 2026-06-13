"use client";

import { KaraokeSession, ConnectedUser } from "@/types";
import { UserIcon } from "@heroicons/react/24/outline";

interface SessionInfoProps {
  session: KaraokeSession;
  totalSongs: number;
}

function filterUniqueUsers(
  user: ConnectedUser,
  index: number,
  array: ConnectedUser[]
): boolean {
  return array.findIndex(u => u.name === user.name) === index;
}

export function SessionInfo({ session, totalSongs }: SessionInfoProps) {
  const uniqueUsers = session.connectedUsers.filter(filterUniqueUsers);

  return (
    <div className="mb-8">
      <div className="bg-gray-900 bg-opacity-30 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">Session Info</h3>
        <div className="grid grid-cols-2 gap-6 text-left">
          <div>
            <p className="text-gray-400 mb-1">Connected Users</p>
            <p className="text-2xl font-bold text-white">
              {uniqueUsers.length}
            </p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Total Songs</p>
            <p className="text-2xl font-bold text-white">{totalSongs}</p>
          </div>
        </div>

        {session.connectedUsers.length > 0 && (
          <div className="mt-4">
            <p className="text-gray-400 mb-2">Connected:</p>
            <div className="flex flex-wrap gap-2">
              {uniqueUsers.map(user => (
                <div
                  key={user.id}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    user.isHost
                      ? "bg-purple-900 text-purple-300 border border-purple-700"
                      : "bg-gray-800 text-gray-300 border border-gray-600"
                  }`}
                >
                  <UserIcon className="w-3 h-3 mr-1" />
                  {user.name}
                  {user.isHost && (
                    <span className="ml-1 text-xs opacity-75">(Host)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
