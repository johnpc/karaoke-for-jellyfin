"use client";

import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { LyricsDisplay } from "@/components/tv/LyricsDisplay";
import { QueuePreview } from "@/components/tv/QueuePreview";
import { HostControls } from "@/components/tv/HostControls";
import { WaitingScreen } from "@/components/tv/WaitingScreen";
import { AudioPlayer } from "@/components/tv/AudioPlayer";
import { NextUpSidebar } from "@/components/tv/NextUpSidebar";

export default function TVDisplay() {
  const [showHostControls, setShowHostControls] = useState(false);
  const [showQueuePreview, setShowQueuePreview] = useState(false);

  const {
    isConnected,
    joinSession,
    session,
    queue,
    currentSong,
    playbackState,
    skipSong,
    playbackControl,
    removeSong,
    reorderQueue,
    updateLocalPlaybackState,
    error,
  } = useWebSocket();

  useEffect(() => {
    // Auto-join session as TV display
    if (isConnected) {
      joinSession("main-session", "TV Display");
    }
  }, [isConnected, joinSession]);

  // Keyboard shortcuts for TV remote/host controls
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case "h":
        case "H":
          setShowHostControls(!showHostControls);
          break;
        case "q":
        case "Q":
          setShowQueuePreview(!showQueuePreview);
          break;
        case " ":
          // Spacebar to play/pause
          event.preventDefault();
          if (playbackState) {
            playbackControl({
              action: playbackState.isPlaying ? "pause" : "play",
              userId: "tv-display",
              timestamp: new Date(),
            });
          }
          break;
        case "s":
        case "S":
          // S to skip
          skipSong();
          break;
        case "Escape":
          setShowHostControls(false);
          setShowQueuePreview(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    showHostControls,
    showQueuePreview,
    playbackState,
    playbackControl,
    skipSong,
  ]);

  // Auto-hide controls after 10 seconds of inactivity
  useEffect(() => {
    if (showHostControls || showQueuePreview) {
      const timer = setTimeout(() => {
        setShowHostControls(false);
        setShowQueuePreview(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [showHostControls, showQueuePreview]);

  // Emergency stop handler
  const handleEmergencyStop = () => {
    playbackControl({
      action: "stop",
      userId: "tv-host",
      timestamp: new Date(),
    });
    // Additional emergency actions could be added here
  };

  // Audio player handlers
  const handleSongEnded = () => {
    // Song ended naturally, skip to next
    skipSong();
  };

  const handleTimeUpdate = (currentTime: number) => {
    // Update local playback state immediately for smooth UI updates
    updateLocalPlaybackState({ currentTime });

    // Send periodic time updates to keep server in sync
    // Only send updates every 2 seconds to avoid spam
    const now = Date.now();
    if (
      !handleTimeUpdate.lastUpdate ||
      now - handleTimeUpdate.lastUpdate > 2000
    ) {
      playbackControl({
        action: "time-update",
        value: currentTime,
        userId: "tv-display",
        timestamp: new Date(),
      });
      handleTimeUpdate.lastUpdate = now;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Connection Status */}
      <div className="absolute top-4 right-4 z-50">
        <div
          className={`flex items-center px-3 py-1 rounded-full text-sm ${
            isConnected
              ? "bg-green-900 text-green-300"
              : "bg-red-900 text-red-300"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full mr-2 ${
              isConnected ? "bg-green-400" : "bg-red-400"
            }`}
          />
          {isConnected ? "Connected" : "Disconnected"}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="absolute top-4 left-4 right-4 z-50">
          <div className="bg-red-900 border border-red-700 rounded-lg p-4">
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {currentSong ? (
        <LyricsDisplay
          song={currentSong}
          playbackState={playbackState}
          isConnected={isConnected}
        />
      ) : (
        <WaitingScreen
          queue={queue}
          session={session}
          isConnected={isConnected}
        />
      )}

      {/* Queue Preview Overlay */}
      {showQueuePreview && (
        <QueuePreview
          queue={queue}
          currentSong={currentSong}
          onClose={() => setShowQueuePreview(false)}
        />
      )}

      {/* Host Controls Overlay */}
      {showHostControls && (
        <HostControls
          session={session}
          currentSong={currentSong}
          playbackState={playbackState}
          onClose={() => setShowHostControls(false)}
          onSkip={skipSong}
          onPlaybackControl={playbackControl}
          onRemoveSong={removeSong}
          onReorderQueue={reorderQueue}
          onEmergencyStop={handleEmergencyStop}
        />
      )}

      {/* Audio Player */}
      <AudioPlayer
        song={currentSong}
        playbackState={playbackState}
        onPlaybackControl={playbackControl}
        onSongEnded={handleSongEnded}
        onTimeUpdate={handleTimeUpdate}
      />

      {/* Next Up Sidebar - Always visible */}
      <NextUpSidebar queue={queue} currentSong={currentSong} />

      {/* Keyboard Shortcuts Help */}
      <div className="absolute bottom-4 left-4 text-gray-500 text-sm">
        <div className="bg-black bg-opacity-50 rounded px-3 py-2">
          Press H for controls • Q for queue • Space to play/pause • S to skip
        </div>
      </div>
    </div>
  );
}
