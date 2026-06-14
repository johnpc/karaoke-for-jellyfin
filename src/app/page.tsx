"use client";

import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { SearchInterface } from "@/components/mobile/SearchInterface";
import { QueueView } from "@/components/mobile/QueueView";
import { UserSetup } from "@/components/mobile/UserSetup";
import { NavigationTabs } from "@/components/mobile/NavigationTabs";
import { ReactionsPanel } from "@/components/mobile/ReactionsPanel";
import { PWAInstaller } from "@/components/PWAInstaller";
import {
  getConnectionStatusColor,
  getConnectionStatusText,
} from "./pageHelpers";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"search" | "queue">("search");
  const [userName, setUserName] = useState<string>("");
  const [isSetup, setIsSetup] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const {
    isConnected,
    joinSession,
    addSong,
    removeSong,
    sendReaction,
    session,
    queue,
    currentSong,
    error,
  } = useWebSocket();

  // Prevent hydration mismatch by only rendering WebSocket-dependent content on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Check if user has already set up their name
    const savedUserName = localStorage.getItem("karaoke-username");
    if (savedUserName) {
      setUserName(savedUserName);
      setIsSetup(true);
    }
  }, []);

  // Auto-join session when connected and user is set up
  useEffect(() => {
    if (isConnected && isSetup && userName && !session) {
      joinSession("main-session", userName);
    }
  }, [isConnected, isSetup, userName, session, joinSession]);

  const handleUserSetup = (name: string) => {
    setUserName(name);
    setIsSetup(true);
    localStorage.setItem("karaoke-username", name);
    joinSession("main-session", name);
  };

  if (!isSetup) {
    return <UserSetup onSetup={handleUserSetup} />;
  }

  // Prevent hydration mismatch by only rendering WebSocket-dependent content on client
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4">
          <div className="flex">
            <div className="ml-3">
              <p data-testid="error-message" className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        queueCount={queue.filter(item => item.status === "pending").length}
      />

      {/* Reactions Panel - visible during playback */}
      {currentSong && (
        <div className="px-4 pt-2">
          <ReactionsPanel onReaction={sendReaction} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "search" ? (
          <div data-testid="search-content">
            <SearchInterface onAddSong={addSong} isConnected={isConnected} />
          </div>
        ) : (
          <div data-testid="queue-content">
            <QueueView
              queue={queue}
              currentSong={currentSong}
              onRemoveSong={removeSong}
              userName={userName}
              session={session}
            />
          </div>
        )}
      </div>

      {/* PWA Install Prompt */}
      <PWAInstaller />
    </div>
  );
}
