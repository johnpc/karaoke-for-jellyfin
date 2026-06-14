"use client";

import { useEffect, useRef, useState } from "react";
import { QueueItem, PlaybackState } from "@/types";
import { setupAudioEventListeners, syncPlaybackState } from "./audioPlayerSync";

interface UseAudioPlayerOptions {
  song: QueueItem | null;
  playbackState: PlaybackState | null;
  onSongEnded: () => void;
  onTimeUpdate: (currentTime: number) => void;
}

interface UseAudioPlayerReturn {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isLoading: boolean;
  error: string | null;
}

export function useAudioPlayer({
  song,
  playbackState,
  onSongEnded,
  onTimeUpdate,
}: UseAudioPlayerOptions): UseAudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const lastSeekTimeRef = useRef<number>(0);

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

    const handleCanPlay = () => {
      console.log("Audio can play");
      setIsLoading(false);
      if (playbackState?.isPlaying && audio.paused) {
        console.log("Audio ready and should be playing - starting playback");
        audio.play().catch(err => {
          console.error("Auto-play on ready failed:", err);
          setError(`Auto-play failed: ${err.message}`);
        });
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
      setIsLoading(false);
      setError("Failed to load audio");
    };

    const handleLoadedData = () => {
      console.log("Audio loaded data");
      setIsLoading(false);
    };

    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);
    audio.addEventListener("loadeddata", handleLoadedData);

    return () => {
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("loadeddata", handleLoadedData);
    };
  }, [song?.id, song?.mediaItem?.streamUrl]);

  // Handle playback state changes
  useEffect(() => {
    if (!audioRef.current || !playbackState || !song) return;
    syncPlaybackState(
      audioRef.current,
      playbackState,
      isLoading,
      lastSeekTimeRef,
      setError
    );
  }, [playbackState, isLoading, song]);

  // Set up audio event listeners
  useEffect(() => {
    if (!audioRef.current) return;
    return setupAudioEventListeners(
      audioRef.current,
      { onTimeUpdate, onSongEnded, setError },
      lastSeekTimeRef
    );
  }, [onTimeUpdate, onSongEnded]);

  return { audioRef, isLoading, error };
}
