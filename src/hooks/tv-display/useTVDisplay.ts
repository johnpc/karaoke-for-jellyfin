"use client";

import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useConfig } from "@/contexts/ConfigContext";
import { UseTVDisplayReturn } from "./types";
import { useTransitionState } from "./useTransitionState";
import { useAutoplay } from "./useAutoplay";
import { useKeyboardControls } from "./useKeyboardControls";
import { useAudioHandlers } from "./useAudioHandlers";

export function useTVDisplay(): UseTVDisplayReturn {
  const config = useConfig();

  const [showHostControls, setShowHostControls] = useState(false);
  const [showQueuePreview, setShowQueuePreview] = useState(false);
  const [isClient, setIsClient] = useState(false);

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

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Transition state machine
  const { transitionState, handleRatingComplete, handleNextSongComplete } =
    useTransitionState({
      currentSong,
      queue,
      startNextSong,
      autoplayDelay: config.autoplayDelay,
      setSongCompletedHandler,
    });

  // Auto-join session as TV display
  useEffect(() => {
    if (isConnected) {
      joinSession("main-session", "TV Display");
    }
  }, [isConnected, joinSession]);

  // Autoplay logic
  const { autoplayCountdown } = useAutoplay({
    currentSong,
    queue,
    isConnected,
    session,
    playbackState,
    transitionState,
    playbackControl,
    autoplayDelay: config.autoplayDelay,
  });

  // Keyboard shortcuts
  useKeyboardControls({
    transitionState,
    playbackState,
    setShowHostControls,
    setShowQueuePreview,
    handleRatingComplete,
    handleNextSongComplete,
    playbackControl,
    skipSong,
  });

  // Auto-hide controls after inactivity
  useEffect(() => {
    if (showHostControls || showQueuePreview) {
      const timer = setTimeout(() => {
        setShowHostControls(false);
        setShowQueuePreview(false);
      }, config.controlsAutoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [showHostControls, showQueuePreview, config.controlsAutoHideDelay]);

  // Audio event handlers
  const { handleEmergencyStop, handleSongEnded, handleTimeUpdate } =
    useAudioHandlers({
      playbackControl,
      songEnded,
      updateLocalPlaybackState,
      timeUpdateInterval: config.timeUpdateInterval,
    });

  return {
    isClient,
    isConnected,
    error,
    session,
    queue,
    currentSong,
    playbackState,
    showHostControls,
    showQueuePreview,
    autoplayCountdown,
    transitionState,
    setShowHostControls,
    setShowQueuePreview,
    handleRatingComplete,
    handleNextSongComplete,
    handleEmergencyStop,
    handleSongEnded,
    handleTimeUpdate,
    skipSong,
    playbackControl,
    removeSong,
    reorderQueue,
  };
}
