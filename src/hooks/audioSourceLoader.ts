"use client";

import { PlaybackState } from "@/types";
import { handlePlayFailure, PlayFailureHandlers } from "./audioPlaybackPolicy";

export interface SourceLoadHandlers {
  playbackState: PlaybackState | null;
  playFailure: PlayFailureHandlers;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Wires the one-shot listeners that follow a `src` change: start playback once
 * the element can play (if the shared state says so), clear the loading flag,
 * and surface load errors. Returns the cleanup that removes them again.
 */
export function attachSourceLoadListeners(
  audio: HTMLMediaElement,
  handlers: SourceLoadHandlers
): () => void {
  const handleCanPlay = () => {
    console.log("Audio can play");
    handlers.setIsLoading(false);
    if (handlers.playbackState?.isPlaying && audio.paused) {
      console.log("Audio ready and should be playing - starting playback");
      audio
        .play()
        .catch(err =>
          handlePlayFailure(err, "Auto-play failed", handlers.playFailure)
        );
    }
  };

  const handleError = (e: Event) => {
    console.error("Audio load error:", e);
    console.error("Audio element error details:", {
      error: audio.error,
      networkState: audio.networkState,
      readyState: audio.readyState,
      src: audio.src,
    });
    handlers.setIsLoading(false);
    handlers.setError("Failed to load audio");
  };

  const handleLoadedData = () => {
    console.log("Audio loaded data");
    handlers.setIsLoading(false);
  };

  audio.addEventListener("canplay", handleCanPlay);
  audio.addEventListener("error", handleError);
  audio.addEventListener("loadeddata", handleLoadedData);

  return () => {
    audio.removeEventListener("canplay", handleCanPlay);
    audio.removeEventListener("error", handleError);
    audio.removeEventListener("loadeddata", handleLoadedData);
  };
}
