"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useConfig } from "@/contexts/ConfigContext";
import { LyricsDisplay } from "@/components/tv/LyricsDisplay";
import { QueuePreview } from "@/components/tv/QueuePreview";
import { HostControls } from "@/components/tv/HostControls";
import { WaitingScreen } from "@/components/tv/WaitingScreen";
import { AudioPlayer } from "@/components/tv/AudioPlayer";
import { NextUpSidebar } from "@/components/tv/NextUpSidebar";
import { QRCode } from "@/components/tv/QRCode";
import { RatingAnimation } from "@/components/tv/RatingAnimation";
import { NextSongSplash } from "@/components/tv/NextSongSplash";
import { ApplausePlayer } from "@/components/tv/ApplausePlayer";
import { TVDisplayState, TransitionState, QueueItem } from "@/types";
import { generateRatingForSong } from "@/lib/ratingGenerator";

export default function TVDisplay() {
  const config = useConfig();
  const [showHostControls, setShowHostControls] = useState(false);
  const [showQueuePreview, setShowQueuePreview] = useState(false);
  const [hasTriggeredAutoPlay, setHasTriggeredAutoPlay] = useState(false);
  const [transitionState, setTransitionState] = useState<TransitionState>({
    displayState: "waiting",
  });
  const lastUpdateRef = useRef<number>(0);
  const lastSongIdRef = useRef<string | null>(null);

  const {
    isConnected,
    joinSession,
    session,
    queue,
    currentSong,
    playbackState,
    skipSong,
    songEnded,
    playbackControl,
    removeSong,
    reorderQueue,
    updateLocalPlaybackState,
    startNextSong,
    setSongCompletedHandler,
    error,
  } = useWebSocket();

  // Handle song completion from socket events
  const handleSongCompleted = useCallback(
    (data: { song: QueueItem; rating: any }) => {
      console.log(
        "🎵 Song completed via socket, starting transition sequence",
        data,
      );

      // Find next song in queue
      const nextSong = queue.find((song) => song.status === "pending");
      console.log("🎵 Next song found:", nextSong?.mediaItem.title || "None");

      // Start applause and rating phase
      setTransitionState({
        displayState: "applause",
        completedSong: data.song,
        nextSong,
        rating: data.rating,
        transitionStartTime: Date.now(),
      });

      console.log(
        "🎵 Transition state set to applause with rating:",
        data.rating.grade,
      );
    },
    [queue],
  );

  // Set up song completion handler
  useEffect(() => {
    setSongCompletedHandler(handleSongCompleted);
  }, [setSongCompletedHandler, handleSongCompleted]);

  // Handle display state transitions based on current song and queue
  useEffect(() => {
    const currentSongId = currentSong?.id || null;

    // If we have a current song and it's different from the last one
    if (currentSong && currentSongId !== lastSongIdRef.current) {
      setTransitionState({
        displayState: "playing",
      });
      lastSongIdRef.current = currentSongId;
    }
    // If we don't have a current song but we have songs in queue
    else if (!currentSong && queue.length > 0) {
      setTransitionState({
        displayState: "waiting",
      });
      lastSongIdRef.current = null;
    }
    // If we have no songs at all
    else if (!currentSong && queue.length === 0) {
      setTransitionState({
        displayState: "waiting",
      });
      lastSongIdRef.current = null;
    }
  }, [currentSong, queue]);

  // Handle song completion and transitions
  const handleRatingComplete = () => {
    console.log("🎵 Rating animation complete");

    if (transitionState.nextSong) {
      // Show next song splash
      console.log(
        "🎵 Showing next song splash for:",
        transitionState.nextSong.mediaItem.title,
      );
      setTransitionState((prev) => ({
        ...prev,
        displayState: "next-up",
      }));
    } else {
      // No next song, go to waiting
      console.log("🎵 No next song, returning to waiting state");
      setTransitionState({
        displayState: "waiting",
      });
    }
  };

  // Handle next song splash completion
  const handleNextSongComplete = () => {
    console.log(
      "🎵 Next song splash complete, requesting next song from server",
    );

    // Transition to playing the next song
    setTransitionState({
      displayState: "transitioning",
    });

    // Trigger playback of next song via socket
    setTimeout(() => {
      console.log("🎵 Emitting start-next-song to server");
      startNextSong();
    }, config.autoplayDelay);
  };

  useEffect(() => {
    // Auto-join session as TV display
    if (isConnected) {
      joinSession("main-session", "TV Display");
    }
  }, [isConnected, joinSession]);
  // Auto-play functionality
  useEffect(() => {
    // Auto-play when:
    // 1. We have a current song
    // 2. We're connected
    // 3. Playback is not already playing
    // 4. We have valid playback state
    // 5. We haven't already triggered auto-play for this song
    // 6. We're in playing state (not in transition)
    if (
      currentSong &&
      isConnected &&
      playbackState &&
      !playbackState.isPlaying &&
      !hasTriggeredAutoPlay &&
      transitionState.displayState === "playing"
    ) {
      console.log("Auto-starting playback for:", currentSong.mediaItem.title);
      setHasTriggeredAutoPlay(true);

      // Small delay to ensure everything is ready
      const autoPlayTimer = setTimeout(() => {
        playbackControl({
          action: "play",
          userId: "tv-display-autoplay",
          timestamp: new Date(),
        });
      }, config.autoplayDelay);

      return () => clearTimeout(autoPlayTimer);
    }
  }, [
    currentSong,
    isConnected,
    playbackState,
    playbackControl,
    hasTriggeredAutoPlay,
    transitionState.displayState,
  ]);

  // Reset auto-play flag when song changes
  useEffect(() => {
    setHasTriggeredAutoPlay(false);
  }, [currentSong?.id]);

  // Auto-play when queue changes from empty to having songs
  useEffect(() => {
    // If we don't have a current song but we have songs in queue,
    // and we're connected, try to start the first song
    if (!currentSong && queue.length > 0 && isConnected && session) {
      const firstPendingSong = queue.find((song) => song.status === "pending");
      if (firstPendingSong) {
        console.log(
          "Auto-starting first song in queue:",
          firstPendingSong.mediaItem.title,
        );

        // Small delay to ensure everything is ready
        const queueAutoPlayTimer = setTimeout(() => {
          playbackControl({
            action: "play",
            userId: "tv-display-queue-autoplay",
            timestamp: new Date(),
          });
        }, config.queueAutoplayDelay);

        return () => clearTimeout(queueAutoPlayTimer);
      }
    }
  }, [queue, currentSong, isConnected, session, playbackControl]);

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
          // Spacebar to play/pause or skip transitions
          event.preventDefault();
          if (transitionState.displayState === "applause") {
            handleRatingComplete();
          } else if (transitionState.displayState === "next-up") {
            handleNextSongComplete();
          } else if (playbackState) {
            playbackControl({
              action: playbackState.isPlaying ? "pause" : "play",
              userId: "tv-display",
              timestamp: new Date(),
            });
          }
          break;
        case "s":
        case "S":
          // S to skip song or transitions
          if (transitionState.displayState === "applause") {
            handleRatingComplete();
          } else if (transitionState.displayState === "next-up") {
            handleNextSongComplete();
          } else {
            skipSong();
          }
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
    transitionState.displayState,
  ]);

  // Auto-hide controls after 10 seconds of inactivity
  useEffect(() => {
    if (showHostControls || showQueuePreview) {
      const timer = setTimeout(() => {
        setShowHostControls(false);
        setShowQueuePreview(false);
      }, config.controlsAutoHideDelay);

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
    // Song ended naturally, notify server (server will handle transitions)
    console.log("Song ended naturally, notifying server");
    songEnded();
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
        userId: "tv-display",
        timestamp: new Date(),
      });
      lastUpdateRef.current = now;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Connection Status */}
      <div className="absolute top-4 right-4 z-50 space-y-2">
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

        {/* Audio status indicator */}
        <div className="flex items-center px-3 py-1 rounded-full text-xs bg-blue-900 text-blue-300">
          <div className="w-2 h-2 rounded-full mr-2 bg-blue-400" />
          Audio Ready
        </div>
      </div>

      {/* QR Code */}
      <div className="absolute top-16 right-4 z-40">
        <div className="text-center">
          <QRCode
            url={
              typeof window !== "undefined"
                ? window.location.origin
                : "http://localhost:3000"
            }
            size={80}
            className="opacity-60 hover:opacity-100 transition-opacity duration-300"
          />
          <div className="text-xs text-gray-400 mt-1 opacity-60">
            Scan to join
          </div>
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
      {transitionState.displayState === "playing" && currentSong ? (
        <LyricsDisplay
          song={currentSong}
          playbackState={playbackState}
          isConnected={isConnected}
        />
      ) : transitionState.displayState === "applause" &&
        transitionState.completedSong &&
        transitionState.rating ? (
        <RatingAnimation
          song={transitionState.completedSong}
          rating={transitionState.rating}
          onComplete={handleRatingComplete}
          duration={config.ratingAnimationDuration}
        />
      ) : transitionState.displayState === "next-up" &&
        transitionState.nextSong ? (
        <NextSongSplash
          nextSong={transitionState.nextSong}
          onComplete={handleNextSongComplete}
          duration={config.nextSongDuration}
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

      {/* Applause Player */}
      <ApplausePlayer
        isPlaying={transitionState.displayState === "applause"}
        volume={60}
      />

      {/* Next Up Sidebar - Always visible */}
      <NextUpSidebar queue={queue} currentSong={currentSong} />

      {/* Keyboard Shortcuts Help */}
      <div className="absolute bottom-4 left-4 text-gray-500 text-sm">
        <div className="bg-black bg-opacity-50 rounded px-3 py-2">
          Auto-play enabled • H for controls • Q for queue • Space to play/pause
          • S to skip • Transitions: {transitionState.displayState}
        </div>
      </div>
    </div>
  );
}
