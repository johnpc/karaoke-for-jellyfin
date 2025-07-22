"use client";

import { QueueItem, KaraokeSession } from "@/types";
import {
  MusicalNoteIcon,
  UserIcon,
  QueueListIcon,
} from "@heroicons/react/24/outline";

interface WaitingScreenProps {
  queue: QueueItem[];
  session: KaraokeSession | null;
  isConnected: boolean;
}

export function WaitingScreen({
  queue,
  session,
  isConnected,
}: WaitingScreenProps) {
  const nextSongs = queue
    .filter((item) => item.status === "pending")
    .slice(0, 3);
  const totalSongs = queue.filter((item) => item.status === "pending").length;

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-8 relative">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 opacity-20"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500 rounded-full opacity-5 animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-500 rounded-full opacity-5 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 right-1/3 w-32 h-32 bg-pink-500 rounded-full opacity-5 animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Main Content */}
      <div className="text-center z-10 max-w-4xl">
        {/* Logo/Title */}
        <div className="mb-12">
          <div className="flex items-center justify-center mb-6">
            <MusicalNoteIcon className="w-16 h-16 text-purple-400 mr-4" />
            <h1 className="text-7xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Karaoke
            </h1>
          </div>
          <p className="text-2xl text-gray-400">For Jellyfin</p>
        </div>

        {/* Status Message */}
        <div className="mb-12">
          {totalSongs > 0 ? (
            <div>
              <h2 className="text-4xl font-semibold text-white mb-4">
                Ready to Rock! 🎤
              </h2>
              <p className="text-xl text-gray-300 mb-2">
                {totalSongs} song{totalSongs !== 1 ? "s" : ""} in the queue
              </p>
              <p className="text-lg text-purple-400 animate-pulse">
                ▶️ Auto-play will start shortly...
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-4xl font-semibold text-white mb-4">
                Waiting for Songs... 🎵
              </h2>
              <p className="text-xl text-gray-300 mb-4">
                Use your phone to search and add songs to the queue
              </p>
              <div className="text-lg text-gray-400 mb-2">
                Visit{" "}
                <span className="text-purple-400 font-mono">
                  {typeof window !== "undefined"
                    ? window.location.origin
                    : "http://localhost:3000"}
                </span>{" "}
                on your mobile device
              </div>
              <p className="text-sm text-green-400">
                ✨ Songs will start playing automatically when added
              </p>
            </div>
          )}
        </div>

        {/* Next Songs Preview */}
        {nextSongs.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-center mb-6">
              <QueueListIcon className="w-8 h-8 text-blue-400 mr-3" />
              <h3 className="text-2xl font-semibold text-white">
                Coming Up Next
              </h3>
            </div>

            <div className="space-y-4">
              {nextSongs.map((song, index) => (
                <div
                  key={song.id}
                  className="bg-gray-900 bg-opacity-50 rounded-lg p-6 border border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mr-4">
                        <span className="text-xl font-bold text-white">
                          {index + 1}
                        </span>
                      </div>
                      <div className="text-left">
                        <h4 className="text-2xl font-semibold text-white">
                          {song.mediaItem.title}
                        </h4>
                        <p className="text-lg text-gray-300">
                          {song.mediaItem.artist}
                        </p>
                        {song.mediaItem.album && (
                          <p className="text-sm text-gray-400">
                            {song.mediaItem.album}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg text-gray-400 mb-1">
                        {formatDuration(song.mediaItem.duration)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <UserIcon className="w-4 h-4 mr-1" />
                        {song.addedBy}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalSongs > 3 && (
              <div className="mt-4 text-lg text-gray-400">
                + {totalSongs - 3} more song{totalSongs - 3 !== 1 ? "s" : ""} in
                queue
              </div>
            )}
          </div>
        )}

        {/* Session Info */}
        {session && (
          <div className="mb-8">
            <div className="bg-gray-900 bg-opacity-30 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">
                Session Info
              </h3>
              <div className="grid grid-cols-2 gap-6 text-left">
                <div>
                  <p className="text-gray-400 mb-1">Connected Users</p>
                  <p className="text-2xl font-bold text-white">
                    {session.connectedUsers.length}
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
                    {session.connectedUsers.map((user) => (
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
                          <span className="ml-1 text-xs opacity-75">
                            (Host)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Connection Status */}
        <div
          className={`inline-flex items-center px-4 py-2 rounded-full text-lg ${
            isConnected
              ? "bg-green-900 text-green-300"
              : "bg-red-900 text-red-300"
          }`}
        >
          <div
            className={`w-3 h-3 rounded-full mr-2 ${
              isConnected ? "bg-green-400" : "bg-red-400"
            }`}
          />
          {isConnected ? "Connected & Ready" : "Connecting..."}
        </div>
      </div>

      {/* Floating Music Notes Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 left-20 text-4xl text-purple-300 opacity-20 animate-bounce"
          style={{ animationDelay: "0s", animationDuration: "3s" }}
        >
          ♪
        </div>
        <div
          className="absolute top-40 right-32 text-3xl text-blue-300 opacity-20 animate-bounce"
          style={{ animationDelay: "1s", animationDuration: "4s" }}
        >
          ♫
        </div>
        <div
          className="absolute bottom-32 left-40 text-5xl text-pink-300 opacity-20 animate-bounce"
          style={{ animationDelay: "2s", animationDuration: "5s" }}
        >
          ♪
        </div>
        <div
          className="absolute bottom-20 right-20 text-3xl text-indigo-300 opacity-20 animate-bounce"
          style={{ animationDelay: "3s", animationDuration: "3.5s" }}
        >
          ♫
        </div>
      </div>
    </div>
  );
}
