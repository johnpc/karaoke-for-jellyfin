"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useConfig } from "@/contexts/ConfigContext";
import {
  TransitionState,
  QueueItem,
  PlaybackState,
  PlaybackCommand,
  KaraokeSession,
  SongRating,
} from "@/types";

interface UseTVDisplayReturn {
  // State
  isClient: boolean;
  isConnected: boolean;
  error: string | null;
  session: KaraokeSession | null;
  queue: QueueItem[];
  currentSong: QueueItem | null;
  playbackState: PlaybackState | null;
  showHostControls: boolean;
  showQueuePreview: boolean;
  autoplayCountdown: number | null;
  transitionState: TransitionState;

  // State setters
  setShowHostControls: (value: boolean) => void;
  setShowQueuePreview: (value: boolean) => void;

  // Handlers
  handleRatingComplete: () => void;
  handleNextSongComplete: () => void;
  handleEmergencyStop: () => void;
  handleSongEnded: () => void;
  handleTimeUpdate: (currentTime: number) => void;

  // WebSocket actions
  skipSong: () => void;
  playbackControl: (command: PlaybackCommand) => void;
  removeSong: (queueItemId: string) => void;
  reorderQueue: (queueItemId: string, newPosition: number) => void;
}

interface KeyboardHandlerState {
  displayState: TransitionState["displayState"];
  playbackState: PlaybackState | null;
}

interface KeyboardHandlerActions {
  setShowHostControls: React.Dispatch<React.SetStateAction<boolean>>;
  setShowQueuePreview: React.Dispatch<React.SetStateAction<boolean>>;
  handleRatingComplete: () => void;
  handleNextSongComplete: () => void;
  playbackControl: (command: PlaybackCommand) => void;
  skipSong: () => void;
}

function handleKeyboardEvent(
  key: string,
  preventDefault: () => void,
  state: KeyboardHandlerState,
  actions: KeyboardHandlerActions
): void {
  switch (key) {
    case "h":
    case "H":
      actions.setShowHostControls(prev => !prev);
      break;
    case "q":
    case "Q":
      actions.setShowQueuePreview(prev => !prev);
      break;
    case " ":
      preventDefault();
      handleSpaceKey(state, actions);
      break;
    case "s":
    case "S":
      handleSkipKey(state, actions);
      break;
    case "Escape":
      actions.setShowHostControls(false);
      actions.setShowQueuePreview(false);
      break;
  }
}

function handleSpaceKey(
  state: KeyboardHandlerState,
  actions: KeyboardHandlerActions
): void {
  if (state.displayState === "applause") {
    actions.handleRatingComplete();
  } else if (state.displayState === "next-up") {
    actions.handleNextSongComplete();
  } else if (state.playbackState) {
    actions.playbackControl({
      action: state.playbackState.isPlaying ? "pause" : "play",
      userId: "tv-display",
      timestamp: new Date(),
    });
  }
}

function handleSkipKey(
  state: KeyboardHandlerState,
  actions: KeyboardHandlerActions
): void {
  if (state.displayState === "applause") {
    actions.handleRatingComplete();
  } else if (state.displayState === "next-up") {
    actions.handleNextSongComplete();
  } else {
    actions.skipSong();
  }
}

interface AutoplayConditions {
  currentSong: QueueItem | null;
  isConnected: boolean;
  playbackState: PlaybackState | null;
  hasTriggeredAutoPlay: boolean;
  displayState: TransitionState["displayState"];
}

function shouldTriggerAutoplay(conditions: AutoplayConditions): boolean {
  const {
    currentSong,
    isConnected,
    playbackState,
    hasTriggeredAutoPlay,
    displayState,
  } = conditions;
  return !!(
    currentSong &&
    isConnected &&
    playbackState &&
    !playbackState.isPlaying &&
    !hasTriggeredAutoPlay &&
    displayState === "playing"
  );
}

function shouldResetAutoplayFlag(
  queueLength: number,
  currentSong: QueueItem | null
): boolean {
  return queueLength === 0 || currentSong !== null;
}

interface FallbackAutoplayConditions {
  currentSong: QueueItem | null;
  queue: QueueItem[];
  isConnected: boolean;
  session: KaraokeSession | null;
  autoplayCountdown: number | null;
  autoplayTriggered: boolean;
}

function shouldTriggerFallbackAutoplay(
  conditions: FallbackAutoplayConditions
): QueueItem | null {
  const {
    currentSong,
    queue,
    isConnected,
    session,
    autoplayCountdown,
    autoplayTriggered,
  } = conditions;
  if (
    !currentSong &&
    queue.length > 0 &&
    isConnected &&
    session &&
    autoplayCountdown === null &&
    !autoplayTriggered
  ) {
    return queue.find(song => song.status === "pending") || null;
  }
  return null;
}

function updateTransitionForSongChange(
  currentSong: QueueItem | null,
  queue: QueueItem[],
  lastSongIdRef: React.MutableRefObject<string | null>,
  setTransitionState: React.Dispatch<React.SetStateAction<TransitionState>>
): void {
  const currentSongId = currentSong?.id || null;

  if (currentSong && currentSongId !== lastSongIdRef.current) {
    setTransitionState({ displayState: "playing" });
    lastSongIdRef.current = currentSongId;
  } else if (!currentSong) {
    setTransitionState({ displayState: "waiting" });
    lastSongIdRef.current = null;
  }
}

export function useTVDisplay(): UseTVDisplayReturn {
  const config = useConfig();

  const [showHostControls, setShowHostControls] = useState(false);
  const [showQueuePreview, setShowQueuePreview] = useState(false);
  const [hasTriggeredAutoPlay, setHasTriggeredAutoPlay] = useState(false);
  const [autoplayCountdown, setAutoplayCountdown] = useState<number | null>(
    null
  );
  const [autoplayTriggered, setAutoplayTriggered] = useState(false);
  const [isClient, setIsClient] = useState(false);
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

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle song completion from socket events
  const handleSongCompleted = useCallback(
    (data: { song: QueueItem; rating: unknown }) => {
      console.log(
        "🎵 Song completed via socket, starting transition sequence",
        data
      );

      const nextSong = queue.find(song => song.status === "pending");
      console.log("🎵 Next song found:", nextSong?.mediaItem.title || "None");

      const rating = data.rating as SongRating;

      setTransitionState({
        displayState: "applause",
        completedSong: data.song,
        nextSong,
        rating,
        transitionStartTime: Date.now(),
      });

      console.log(
        "🎵 Transition state set to applause with rating:",
        rating.grade
      );
    },
    [queue]
  );

  // Set up song completion handler
  useEffect(() => {
    setSongCompletedHandler(handleSongCompleted);
  }, [setSongCompletedHandler, handleSongCompleted]);

  // Handle display state transitions based on current song and queue
  useEffect(() => {
    updateTransitionForSongChange(
      currentSong,
      queue,
      lastSongIdRef,
      setTransitionState
    );
  }, [currentSong, queue]);

  // Handle rating animation completion
  const handleRatingComplete = useCallback(() => {
    if (transitionState.nextSong) {
      setTransitionState(prev => ({
        ...prev,
        displayState: "next-up",
      }));
    } else {
      setTransitionState({ displayState: "waiting" });
    }
  }, [transitionState.nextSong]);

  // Handle next song splash completion
  const handleNextSongComplete = useCallback(() => {
    console.log(
      "🎵 Next song splash complete, requesting next song from server"
    );

    setTransitionState({
      displayState: "transitioning",
    });

    setTimeout(() => {
      console.log("🎵 Emitting start-next-song to server");
      startNextSong();
    }, config.autoplayDelay);
  }, [startNextSong, config.autoplayDelay]);

  // Auto-join session as TV display
  useEffect(() => {
    if (isConnected) {
      joinSession("main-session", "TV Display");
    }
  }, [isConnected, joinSession]);

  // Auto-play functionality
  useEffect(() => {
    if (
      shouldTriggerAutoplay({
        currentSong,
        isConnected,
        playbackState,
        hasTriggeredAutoPlay,
        displayState: transitionState.displayState,
      })
    ) {
      console.log("Auto-starting playback for:", currentSong!.mediaItem.title);
      setHasTriggeredAutoPlay(true);

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
    config.autoplayDelay,
  ]);

  // Reset auto-play flag when song changes
  useEffect(() => {
    setHasTriggeredAutoPlay(false);
  }, [currentSong?.id]);

  // Debug effect to track state changes
  useEffect(() => {
    console.log("🔍 TV State Debug:", {
      currentSong: currentSong ? currentSong.mediaItem.title : null,
      queueLength: queue.length,
      pendingSongs: queue.filter(s => s.status === "pending").length,
      isConnected,
      hasSession: !!session,
      autoplayCountdown,
      transitionState: transitionState.displayState,
    });
  }, [
    currentSong,
    queue,
    isConnected,
    session,
    autoplayCountdown,
    transitionState.displayState,
  ]);

  // Fallback auto-play when queue changes from empty to having songs
  useEffect(() => {
    const firstPendingSong = shouldTriggerFallbackAutoplay({
      currentSong,
      queue,
      isConnected,
      session,
      autoplayCountdown,
      autoplayTriggered,
    });

    if (firstPendingSong) {
      console.log(
        "Fallback: Auto-starting first song in queue:",
        firstPendingSong.mediaItem.title
      );

      setAutoplayTriggered(true);

      const countdownDuration = 2;
      setAutoplayCountdown(countdownDuration);

      const countdownInterval = setInterval(() => {
        setAutoplayCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      const queueAutoPlayTimer = setTimeout(() => {
        setAutoplayCountdown(null);
        playbackControl({
          action: "play",
          userId: "tv-display-fallback-autoplay",
          timestamp: new Date(),
        });
      }, 2000);

      return () => {
        clearTimeout(queueAutoPlayTimer);
        clearInterval(countdownInterval);
        setAutoplayCountdown(null);
      };
    }
  }, [
    queue.length,
    currentSong?.id,
    isConnected,
    session?.id,
    playbackControl,
    autoplayTriggered,
  ]);

  // Reset autoplay flag when queue becomes empty or when a song starts
  useEffect(() => {
    if (shouldResetAutoplayFlag(queue.length, currentSong)) {
      setAutoplayTriggered(false);
    }
  }, [queue.length, currentSong]);

  // Keyboard shortcuts for TV remote/host controls
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      handleKeyboardEvent(
        event.key,
        () => event.preventDefault(),
        {
          displayState: transitionState.displayState,
          playbackState,
        },
        {
          setShowHostControls,
          setShowQueuePreview,
          handleRatingComplete,
          handleNextSongComplete,
          playbackControl,
          skipSong,
        }
      );
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    playbackState,
    playbackControl,
    skipSong,
    transitionState.displayState,
    handleRatingComplete,
    handleNextSongComplete,
  ]);

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

  // Emergency stop handler
  const handleEmergencyStop = useCallback(() => {
    playbackControl({
      action: "stop",
      userId: "tv-host",
      timestamp: new Date(),
    });
  }, [playbackControl]);

  // Audio player: song ended naturally
  const handleSongEnded = useCallback(() => {
    console.log("Song ended naturally, notifying server");
    songEnded();
  }, [songEnded]);

  // Audio player: periodic time updates
  const handleTimeUpdate = useCallback(
    (currentTime: number) => {
      updateLocalPlaybackState({ currentTime });

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
    },
    [updateLocalPlaybackState, playbackControl, config.timeUpdateInterval]
  );

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
