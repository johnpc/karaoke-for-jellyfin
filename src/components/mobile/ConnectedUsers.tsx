"use client";

import { UserIcon } from "@heroicons/react/24/outline";
import { ConnectedUser } from "@/types";

interface ConnectedUsersProps {
  users: ConnectedUser[];
  userName: string;
}

export function ConnectedUsers({ users, userName }: ConnectedUsersProps) {
  const uniqueUsers = users.filter(
    (user, index, array) => array.findIndex(u => u.name === user.name) === index
  );

  if (uniqueUsers.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 border-t border-gray-200 p-4">
      <div className="text-sm text-gray-600 mb-2">
        Connected ({users.length})
      </div>
      <div className="flex flex-wrap gap-2">
        {uniqueUsers.map(user => (
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
  );
}
