"use client";

import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { SearchInterface } from "@/components/mobile/SearchInterface";
import { QueueView } from "@/components/mobile/QueueView";
import { UserSetup } from "@/components/mobile/UserSetup";
import { NavigationTabs, TabType } from "@/components/mobile/NavigationTabs";
import { ReactionsPanel } from "@/components/mobile/ReactionsPanel";
import { MySongs } from "@/components/mobile/MySongs";
import { AppHeader } from "@/components/mobile/AppHeader";
import { useSongHistory } from "@/hooks/useSongHistory";
import { PWAInstaller } from "@/components/PWAInstaller";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("search");
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

  const { favorites, recentHistory, addToHistory, toggleFavorite } =
    useSongHistory(userName);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const savedUserName = localStorage.getItem("karaoke-username");
    if (savedUserName) {
      setUserName(savedUserName);
      setIsSetup(true);
    }
  }, []);

  useEffect(() => {
    if (isConnected && isSetup && userName && !session) {
      joinSession("main-session", userName);
    }
  }, [isConnected, isSetup, userName, session, joinSession]);

  const handleAddSong = async (mediaItem: Parameters<typeof addSong>[0]) => {
    await addSong(mediaItem);
    addToHistory(mediaItem);
  };

  const handleUserSetup = (name: string) => {
    setUserName(name);
    setIsSetup(true);
    localStorage.setItem("karaoke-username", name);
    joinSession("main-session", name);
  };

  if (!isSetup) {
    return <UserSetup onSetup={handleUserSetup} />;
  }

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader isConnected={isConnected} userName={userName} error={error} />
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        queueCount={queue.filter(item => item.status === "pending").length}
      />
      {currentSong && <ReactionsPanel onReaction={sendReaction} />}
      <div className="flex-1 overflow-hidden">
        {activeTab === "search" && (
          <div data-testid="search-content">
            <SearchInterface
              onAddSong={handleAddSong}
              isConnected={isConnected}
            />
          </div>
        )}
        {activeTab === "queue" && (
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
        {activeTab === "my-songs" && (
          <div data-testid="my-songs-content">
            <MySongs
              favorites={favorites}
              recentHistory={recentHistory}
              onToggleFavorite={toggleFavorite}
              onAddSong={handleAddSong}
            />
          </div>
        )}
      </div>
      <PWAInstaller />
    </div>
  );
}
