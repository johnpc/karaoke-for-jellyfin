"use client";

import { useEffect, useRef, useState } from "react";
import { QueueItem, PlaybackState } from "@/types";

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

interface AudioEventHandlers {
  onTimeUpdate: (currentTime: number) => void;
  onSongEnded: () => void;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

function setupAudioEventListeners(
  audio: HTMLAudioElement,
  handlers: AudioEventHandlers,
  lastSeekTimeRef: React.MutableRefObject<number>
): () => void {
  const handleTimeUpdate = () => {
    const currentTime = audio.currentTime;
    if (Math.abs(currentTime - lastSeekTimeRef.current) > 0.5) {
      handlers.onTimeUpdate(currentTime);
    }
  };

  const handleEnded = () => {
    console.log("Song ended");
    handlers.onSongEnded();
  };

  const handlePlay = () => {
    console.log("Audio play event");
    handlers.setError(null);
  };

  const handlePause = () => {
    console.log("Audio pause event");
  };

  const handleError = (e: Event) => {
    console.error("Audio playback error:", e);
    handlers.setError("Playback error occurred");
  };

  let timeUpdateThrottle: NodeJS.Timeout;
  const throttledTimeUpdate = () => {
    clearTimeout(timeUpdateThrottle);
    timeUpdateThrottle = setTimeout(handleTimeUpdate, 250);
  };

  audio.addEventListener("timeupdate", throttledTimeUpdate);
  audio.addEventListener("ended", handleEnded);
  audio.addEventListener("play", handlePlay);
  audio.addEventListener("pause", handlePause);
  audio.addEventListener("error", handleError);

  return () => {
    clearTimeout(timeUpdateThrottle);
    audio.removeEventListener("timeupdate", throttledTimeUpdate);
    audio.removeEventListener("ended", handleEnded);
    audio.removeEventListener("play", handlePlay);
    audio.removeEventListener("pause", handlePause);
    audio.removeEventListener("error", handleError);
  };
}

function syncPlaybackState(
  audio: HTMLAudioElement,
  playbackState: PlaybackState,
  isLoading: boolean,
  lastSeekTimeRef: React.MutableRefObject<number>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
): void {
  syncPlayPause(audio, playbackState, isLoading, setError);
  syncMuteAndVolume(audio, playbackState);
  syncSeekPosition(audio, playbackState, lastSeekTimeRef);
  syncPlaybackRate(audio, playbackState);
}

function syncPlayPause(
  audio: HTMLAudioElement,
  playbackState: PlaybackState,
  isLoading: boolean,
  setError: React.Dispatch<React.SetStateAction<string | null>>
): void {
  if (playbackState.isPlaying && audio.paused && !isLoading) {
    if (audio.readyState >= 2) {
      audio.play().catch(err => {
        console.error("Play failed:", err);
        setError(`Play failed: ${err.message}`);
      });
    }
  } else if (!playbackState.isPlaying && !audio.paused) {
    audio.pause();
  }
}

function syncMuteAndVolume(
  audio: HTMLAudioElement,
  playbackState: PlaybackState
): void {
  if (playbackState.isMuted !== undefined) {
    audio.muted = playbackState.isMuted;
  }

  if (playbackState.volume !== undefined && !playbackState.isMuted) {
    const volume = Math.max(0, Math.min(1, playbackState.volume / 100));
    if (audio.volume !== volume) {
      audio.volume = volume;
    }
  }
}

function syncSeekPosition(
  audio: HTMLAudioElement,
  playbackState: PlaybackState,
  lastSeekTimeRef: React.MutableRefObject<number>
): void {
  if (
    playbackState.currentTime !== undefined &&
    isFinite(playbackState.currentTime) &&
    playbackState.currentTime >= 0
  ) {
    const timeDiff = Math.abs(audio.currentTime - playbackState.currentTime);
    const lastSeekDiff = Math.abs(
      lastSeekTimeRef.current - playbackState.currentTime
    );
    if (timeDiff > 2 && lastSeekDiff > 0.1) {
      console.log("Seeking to:", playbackState.currentTime);
      lastSeekTimeRef.current = playbackState.currentTime;
      audio.currentTime = playbackState.currentTime;
    }
  }
}

function syncPlaybackRate(
  audio: HTMLAudioElement,
  playbackState: PlaybackState
): void {
  if (
    playbackState.playbackRate !== undefined &&
    isFinite(playbackState.playbackRate) &&
    playbackState.playbackRate > 0 &&
    playbackState.playbackRate <= 4
  ) {
    audio.playbackRate = playbackState.playbackRate;
  }
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
