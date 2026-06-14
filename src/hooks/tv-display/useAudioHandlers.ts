import { useRef, useCallback } from "react";
import { PlaybackCommand } from "@/types";

interface UseAudioHandlersParams {
  playbackControl: (command: PlaybackCommand) => void;
  songEnded: () => void;
  updateLocalPlaybackState: (state: { currentTime: number }) => void;
  timeUpdateInterval: number;
}

interface UseAudioHandlersReturn {
  handleEmergencyStop: () => void;
  handleSongEnded: () => void;
  handleTimeUpdate: (currentTime: number) => void;
}

export function useAudioHandlers(
  params: UseAudioHandlersParams
): UseAudioHandlersReturn {
  const {
    playbackControl,
    songEnded,
    updateLocalPlaybackState,
    timeUpdateInterval,
  } = params;

  const lastUpdateRef = useRef<number>(0);

  const handleEmergencyStop = useCallback(() => {
    playbackControl({
      action: "stop",
      userId: "tv-host",
      timestamp: new Date(),
    });
  }, [playbackControl]);

  const handleSongEnded = useCallback(() => {
    console.log("Song ended naturally, notifying server");
    songEnded();
  }, [songEnded]);

  const handleTimeUpdate = useCallback(
    (currentTime: number) => {
      updateLocalPlaybackState({ currentTime });

      const now = Date.now();
      if (
        !lastUpdateRef.current ||
        now - lastUpdateRef.current > timeUpdateInterval
      ) {
        playbackControl({
          action: "time-update",
          value: currentTime,
          userId: "tv-display",
          timestamp: new Date(),
        } as PlaybackCommand);
        lastUpdateRef.current = now;
      }
    },
    [updateLocalPlaybackState, playbackControl, timeUpdateInterval]
  );

  return { handleEmergencyStop, handleSongEnded, handleTimeUpdate };
}
