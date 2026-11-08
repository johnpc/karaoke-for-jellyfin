"use client";

import { useEffect, useRef, useState } from "react";
import { QueueItem, PlaybackState } from "@/types";
import { attachSourceLoadListeners } from "./audioSourceLoader";
import { setupAudioEventListeners } from "./audioEventListeners";
import { syncPlaybackState } from "./audioPlayerSync";
import { useAutoplayGate } from "./useAutoplayGate";

interface UseAudioPlayerOptions {
  song: QueueItem | null;
  playbackState: PlaybackState | null;
  onSongEnded: () => void;
  onTimeUpdate: (currentTime: number) => void;
}

interface UseAudioPlayerReturn<T extends HTMLMediaElement> {
  audioRef: React.RefObject<T | null>;
  isLoading: boolean;
  error: string | null;
  /** See `useAutoplayGate`: the browser needs a tap before audio can start. */
  needsUserGesture: boolean;
  /** Call from a tap/click handler to unlock audio and start playback. */
  startPlaybackFromGesture: () => void;
}

/**
 * Drives an <audio> (default) or <video> element from the shared playback
 * state. The element type is generic so the TV's VideoPlayer can reuse the
 * exact same load/play/pause/seek/volume/ended logic.
 */
export function useAudioPlayer<T extends HTMLMediaElement = HTMLAudioElement>({
  song,
  playbackState,
  onSongEnded,
  onTimeUpdate,
}: UseAudioPlayerOptions): UseAudioPlayerReturn<T> {
  const audioRef = useRef<T>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const lastSeekTimeRef = useRef<number>(0);

  const { needsUserGesture, playFailure, startPlaybackFromGesture } =
    useAutoplayGate({
      audioRef,
      shouldBePlaying: playbackState?.isPlaying ?? false,
      setError,
    });

  // Update audio source when song changes
  useEffect(() => {
    if (!audioRef.current || !song) {
      setCurrentSongId(null);
      return;
    }

    if (currentSongId === song.id) {
      return;
    }

    const audio = audioRef.current;
    setIsLoading(true);
    setError(null);
    setCurrentSongId(song.id);

    console.log(
      "Loading new song:",
      song.mediaItem.title,
      song.mediaItem.streamUrl
    );

    if (!song.mediaItem.streamUrl) {
      console.error("No stream URL provided for song:", song.mediaItem.title);
      setError("No stream URL available");
      setIsLoading(false);
      return;
    }

    audio.src = song.mediaItem.streamUrl;
    console.log("Audio element src set to:", audio.src);
    audio.load();

    return attachSourceLoadListeners(audio, {
      playbackState,
      playFailure,
      setIsLoading,
      setError,
    });
  }, [song?.id, song?.mediaItem?.streamUrl]);

  // Handle playback state changes
  useEffect(() => {
    if (!audioRef.current || !playbackState || !song) return;
    syncPlaybackState(audioRef.current, playbackState, {
      isLoading,
      autoplayBlocked: needsUserGesture,
      lastSeekTimeRef,
      playFailure,
    });
  }, [playbackState, isLoading, song, needsUserGesture, playFailure]);

  // Set up audio event listeners
  useEffect(() => {
    if (!audioRef.current) return;
    return setupAudioEventListeners(
      audioRef.current,
      { onTimeUpdate, onSongEnded, setError },
      lastSeekTimeRef
    );
  }, [onTimeUpdate, onSongEnded]);

  return {
    audioRef,
    isLoading,
    error,
    needsUserGesture,
    startPlaybackFromGesture,
  };
}
