"use client";

import { useEffect, useRef, useState } from "react";
import { QueueItem, PlaybackState, PlaybackCommand } from "@/types";

interface AudioPlayerProps {
  song: QueueItem | null;
  playbackState: PlaybackState | null;
  onPlaybackControl: (command: PlaybackCommand) => void;
  onSongEnded: () => void;
  onTimeUpdate: (currentTime: number) => void;
}

export function AudioPlayer({
  song,
  playbackState,
  onPlaybackControl,
  onSongEnded,
  onTimeUpdate,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const lastSeekTimeRef = useRef<number>(0);

  // Update audio source when song changes (but not on playback state changes)
  useEffect(() => {
    if (!audioRef.current || !song) {
      setCurrentSongId(null);
      return;
    }

    // Only reload if it's actually a different song
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

    // Validate stream URL
    if (!song.mediaItem.streamUrl) {
      console.error("No stream URL provided for song:", song.mediaItem.title);
      setError("No stream URL available");
      setIsLoading(false);
      return;
    }

    // Set new source
    audio.src = song.mediaItem.streamUrl;
    console.log("Audio element src set to:", audio.src);
    audio.load();

    const handleCanPlay = () => {
      console.log("Audio can play");
      setIsLoading(false);

      // If playback state indicates we should be playing, start playback now
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
  }, [song?.id, song?.mediaItem?.streamUrl]); // Only depend on song ID and URL, not playback state

  // Handle playback state changes (separate from loading)
  useEffect(() => {
    console.log("AudioPlayer - Playback state effect triggered:", {
      hasAudio: !!audioRef.current,
      hasPlaybackState: !!playbackState,
      hasSong: !!song,
      isPlaying: playbackState?.isPlaying,
      isLoading,
      audioPaused: audioRef.current?.paused,
      audioReadyState: audioRef.current?.readyState,
      audioNetworkState: audioRef.current?.networkState,
    });

    if (!audioRef.current || !playbackState || !song) return;

    const audio = audioRef.current;

    // Handle play/pause
    if (playbackState.isPlaying && audio.paused && !isLoading) {
      console.log("Starting playback - audio ready state:", audio.readyState);

      // Check if audio is ready to play
      if (audio.readyState >= 2) {
        // HAVE_CURRENT_DATA or higher
        audio.play().catch(err => {
          console.error("Play failed:", err);
          setError(`Play failed: ${err.message}`);
        });
      } else {
        console.log("Audio not ready yet, waiting for canplay event");
        // The canplay event handler will start playback when ready
      }
    } else if (!playbackState.isPlaying && !audio.paused) {
      console.log("Pausing playback");
      audio.pause();
    }

    // Handle volume changes
    if (playbackState.isMuted !== undefined) {
      audio.muted = playbackState.isMuted;
    }

    if (playbackState.volume !== undefined && !playbackState.isMuted) {
      const volume = Math.max(0, Math.min(1, playbackState.volume / 100));
      if (audio.volume !== volume) {
        audio.volume = volume;
      }
    }

    // Handle seek (only if significantly different and not from our own timeupdate)
    if (
      playbackState.currentTime !== undefined &&
      isFinite(playbackState.currentTime) &&
      playbackState.currentTime >= 0
    ) {
      const timeDiff = Math.abs(audio.currentTime - playbackState.currentTime);
      const lastSeekDiff = Math.abs(
        lastSeekTimeRef.current - playbackState.currentTime
      );

      // Only seek if the difference is significant and it's not the same seek we just did
      if (timeDiff > 2 && lastSeekDiff > 0.1) {
        console.log("Seeking to:", playbackState.currentTime);
        lastSeekTimeRef.current = playbackState.currentTime;
        audio.currentTime = playbackState.currentTime;
      }
    }

    // Handle playback rate
    if (
      playbackState.playbackRate !== undefined &&
      isFinite(playbackState.playbackRate) &&
      playbackState.playbackRate > 0 &&
      playbackState.playbackRate <= 4
    ) {
      audio.playbackRate = playbackState.playbackRate;
    }
  }, [playbackState, isLoading, song]);

  // Set up audio event listeners (only once)
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      // Throttle time updates to avoid spam
      const currentTime = audio.currentTime;
      if (Math.abs(currentTime - lastSeekTimeRef.current) > 0.5) {
        onTimeUpdate(currentTime);
      }
    };

    const handleEnded = () => {
      console.log("Song ended");
      onSongEnded();
    };

    const handlePlay = () => {
      console.log("Audio play event");
      setError(null);
    };

    const handlePause = () => {
      console.log("Audio pause event");
    };

    const handleError = (e: Event) => {
      console.error("Audio playback error:", e);
      setError("Playback error occurred");
    };

    // Throttle time updates
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
  }, [onTimeUpdate, onSongEnded]);

  return (
    <>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        data-testid="audio-player"
        aria-label="Karaoke audio player"
        preload="auto"
        style={{ display: "none" }}
      />

      {/* Audio error display */}
      {error && (
        <div
          data-testid="audio-error"
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-900 border border-red-700 rounded-lg p-4 text-red-300"
        >
          Audio Error: {error}
        </div>
      )}
    </>
  );
}
