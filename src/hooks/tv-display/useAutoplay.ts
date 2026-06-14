import { useState, useEffect } from "react";
import { UseAutoplayParams, UseAutoplayReturn } from "./types";
import {
  shouldTriggerAutoplay,
  shouldTriggerFallbackAutoplay,
} from "./autoplayLogic";

export function useAutoplay(params: UseAutoplayParams): UseAutoplayReturn {
  const {
    currentSong,
    queue,
    isConnected,
    session,
    playbackState,
    transitionState,
    playbackControl,
    autoplayDelay,
  } = params;

  const [hasTriggeredAutoPlay, setHasTriggeredAutoPlay] = useState(false);
  const [autoplayCountdown, setAutoplayCountdown] = useState<number | null>(
    null
  );
  const [autoplayTriggered, setAutoplayTriggered] = useState(false);

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
      }, autoplayDelay);

      return () => clearTimeout(autoPlayTimer);
    }
  }, [
    currentSong,
    isConnected,
    playbackState,
    playbackControl,
    hasTriggeredAutoPlay,
    transitionState.displayState,
    autoplayDelay,
  ]);

  // Reset auto-play flag when song changes
  useEffect(() => {
    setHasTriggeredAutoPlay(false);
  }, [currentSong?.id]);

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
      setAutoplayCountdown(2);

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
    if (queue.length === 0 || currentSong !== null) {
      setAutoplayTriggered(false);
    }
  }, [queue.length, currentSong]);

  return { autoplayCountdown };
}
