"use client";

import { QueueItem, KaraokeSession } from "@/types";
import { MusicalNoteIcon } from "@heroicons/react/24/outline";
import { BackgroundAnimation } from "@/components/tv/waiting/BackgroundAnimation";
import { ConnectionStatus } from "@/components/tv/waiting/ConnectionStatus";
import { QueuePreview } from "@/components/tv/waiting/QueuePreview";
import { SessionInfo } from "@/components/tv/waiting/SessionInfo";

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
  const nextSongs = queue.filter(item => item.status === "pending").slice(0, 3);
  const totalSongs = queue.filter(item => item.status === "pending").length;

  return (
    <div
      data-testid="waiting-screen"
      className="min-h-screen flex flex-col justify-center items-center p-8 relative"
    >
      <BackgroundAnimation />

      <div className="text-center z-10 max-w-4xl">
        <div className="mb-12">
          <div className="flex items-center justify-center mb-6">
            <MusicalNoteIcon className="w-16 h-16 text-purple-400 mr-4" />
            <h1
              data-testid="app-title"
              className="text-7xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
            >
              Karaoke
            </h1>
          </div>
          <p className="text-2xl text-gray-400">For Jellyfin</p>
        </div>

        <div className="mb-12">
          {totalSongs > 0 ? (
            <div>
              <h2 className="text-4xl font-semibold text-white mb-4">
                Ready to Rock! &#127908;
              </h2>
              <p className="text-xl text-gray-300 mb-2">
                {totalSongs} song{totalSongs !== 1 ? "s" : ""} in the queue
              </p>
              <p className="text-lg text-purple-400 animate-pulse">
                &#9654;&#65039; Auto-play will start shortly...
              </p>
            </div>
          ) : (
            <div data-testid="instructions">
              <h2 className="text-4xl font-semibold text-white mb-4">
                Waiting for Songs... &#127925;
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
                on your mobile device or scan the QR code
              </div>
              <p className="text-sm text-green-400">
                &#10024; Songs will start playing automatically when added
              </p>
            </div>
          )}
        </div>

        <QueuePreview nextSongs={nextSongs} totalSongs={totalSongs} />

        {session && <SessionInfo session={session} totalSongs={totalSongs} />}

        <ConnectionStatus isConnected={isConnected} />
      </div>
    </div>
  );
}
