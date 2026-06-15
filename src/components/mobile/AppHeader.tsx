"use client";

import {
  getConnectionStatusColor,
  getConnectionStatusText,
} from "@/app/pageHelpers";

interface AppHeaderProps {
  isConnected: boolean;
  userName: string;
  error: string | null;
}

export function AppHeader({ isConnected, userName, error }: AppHeaderProps) {
  return (
    <>
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">
            Karaoke For Jellyfin
          </h1>
          <div className="flex items-center mt-1">
            <div
              className={`w-2 h-2 rounded-full mr-2 ${getConnectionStatusColor(isConnected, error)}`}
            />
            <span
              data-testid="connection-status"
              className="text-sm text-gray-600"
            >
              {getConnectionStatusText(isConnected, userName, error)}
            </span>
          </div>
        </div>
      </div>
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4">
          <p data-testid="error-message" className="text-sm text-red-700">
            {error}
          </p>
        </div>
      )}
    </>
  );
}
