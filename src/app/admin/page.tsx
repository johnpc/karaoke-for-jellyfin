"use client";

import { useState, useEffect, useRef } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useConfig } from "@/contexts/ConfigContext";
import { MobileAdminInterface } from "@/components/mobile/MobileAdminInterface";
import { UserSetup } from "@/components/mobile/UserSetup";
import { AudioPlayer } from "@/components/tv/AudioPlayer";

export default function AdminPage() {
  const config = useConfig();
  const [userName, setUserName] = useState<string>("");
  const [isSetup, setIsSetup] = useState(false);
  const lastUpdateRef = useRef<number>(0);

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
    updateLocalPlaybackState,
    songEnded,
  } = useWebSocket();

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

  const handleTimeUpdate = (currentTime: number) => {
    // Update local playback state immediately for smooth UI updates
    updateLocalPlaybackState({ currentTime });

    // Send periodic time updates to keep server in sync
    // Only send updates every 2 seconds to avoid spam
    const now = Date.now();
    const updateInterval = config.timeUpdateInterval;
    if (
      !lastUpdateRef.current ||
      now - lastUpdateRef.current > updateInterval
    ) {
      playbackControl({
        action: "time-update",
        value: currentTime,
        userId: "mobile-admin",
        timestamp: new Date(),
      });
      lastUpdateRef.current = now;
    }
  };

  const handleSongEnded = () => {
    console.log("Song ended in admin interface");
    songEnded();
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

  return (
    <>
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
      
      {/* Hidden AudioPlayer for time synchronization */}
      <AudioPlayer
        song={currentSong}
        playbackState={playbackState}
        onPlaybackControl={playbackControl}
        onSongEnded={handleSongEnded}
        onTimeUpdate={handleTimeUpdate}
      />
    </>
  );
}
