"use client";

import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { MobileAdminInterface } from "@/components/mobile/MobileAdminInterface";
import { UserSetup } from "@/components/mobile/UserSetup";

export default function AdminPage() {
  const [userName, setUserName] = useState<string>("");
  const [isSetup, setIsSetup] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const {
    isConnected,
    joinSession,
    session,
    queue,
    currentSong,
    playbackState,
    error,
    skipSong,
    playbackControl,
    removeSong,
    reorderQueue,
  } = useWebSocket();

  // Prevent hydration mismatch by only rendering WebSocket-dependent content on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Check if user has already set up their name
    const savedUserName = localStorage.getItem("karaoke-admin-username");
    if (savedUserName) {
      setUserName(savedUserName);
      setIsSetup(true);
    }
  }, []);

  // Auto-join session when connected and user is set up
  useEffect(() => {
    if (isConnected && isSetup && userName) {
      if (!session) {
        console.log("Admin joining session:", userName);
        joinSession("main-session", userName);
      }
    }
  }, [isConnected, isSetup, userName, session, joinSession]);

  const handleUserSetup = (name: string) => {
    const adminName = `${name} (Admin)`;
    setUserName(adminName);
    setIsSetup(true);
    localStorage.setItem("karaoke-admin-username", adminName);
    joinSession("main-session", adminName);
  };

  if (!isSetup) {
    return (
      <UserSetup
        onSetup={handleUserSetup}
        title="Admin Setup"
        subtitle="Enter your name to access admin controls"
      />
    );
  }

  // Prevent hydration mismatch by only rendering WebSocket-dependent content on client
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading admin interface...</div>
      </div>
    );
  }

  return (
    <MobileAdminInterface
      session={session}
      currentSong={currentSong}
      playbackState={playbackState}
      queue={queue}
      userName={userName}
      isConnected={isConnected}
      error={error}
      onSkip={skipSong}
      onPlaybackControl={playbackControl}
      onRemoveSong={removeSong}
      onReorderQueue={reorderQueue}
    />
  );
}
