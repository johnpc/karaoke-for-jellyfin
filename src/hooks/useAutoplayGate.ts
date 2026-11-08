"use client";

import { useCallback, useMemo, useState } from "react";
import { handlePlayFailure, PlayFailureHandlers } from "./audioPlaybackPolicy";

interface UseAutoplayGateOptions {
  audioRef: React.RefObject<HTMLMediaElement | null>;
  /** Whether the host currently wants the song playing. */
  shouldBePlaying: boolean;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export interface UseAutoplayGateReturn {
  /**
   * True when the browser refused to start audio without a user gesture
   * (iOS/iPadOS Safari always does). The UI should show a tap target that
   * calls `startPlaybackFromGesture`.
   */
  needsUserGesture: boolean;
  /** Handlers to pass to every play() rejection path. */
  playFailure: PlayFailureHandlers;
  /**
   * Must be called directly from a user-gesture event handler (tap/click).
   * Starting the element from a gesture unlocks it for the rest of the
   * session, so later songs can autoplay on the same element.
   */
  startPlaybackFromGesture: () => void;
}

export function useAutoplayGate({
  audioRef,
  shouldBePlaying,
  setError,
}: UseAutoplayGateOptions): UseAutoplayGateReturn {
  const [needsUserGesture, setNeedsUserGesture] = useState(false);

  const playFailure = useMemo<PlayFailureHandlers>(
    () => ({ setError, onAutoplayBlocked: () => setNeedsUserGesture(true) }),
    [setError]
  );

  const startPlaybackFromGesture = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // play() has to be invoked synchronously inside the gesture handler for
    // Safari to treat it as user-initiated; do not await anything first.
    audio
      .play()
      .then(() => {
        setNeedsUserGesture(false);
        setError(null);
        // If the host paused meanwhile we only wanted to unlock the element.
        if (!shouldBePlaying) audio.pause();
      })
      .catch(err => handlePlayFailure(err, "Play failed", playFailure));
  }, [audioRef, shouldBePlaying, setError, playFailure]);

  return { needsUserGesture, playFailure, startPlaybackFromGesture };
}
