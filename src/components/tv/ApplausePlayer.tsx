"use client";

import { useEffect, useRef } from "react";

interface ApplausePlayerProps {
  isPlaying: boolean;
  volume?: number; // 0-100
}

export function ApplausePlayer({
  isPlaying,
  volume = 70,
}: ApplausePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  // Array of applause sound variations
  const applauseSounds = [
    "/sounds/applause-1.mp3",
    "/sounds/applause-2.mp3",
    "/sounds/applause-3.mp3",
    "/sounds/applause-crowd.mp3",
    "/sounds/applause-crowd-2.mp3",
  ];

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      console.log("🎵 Applause triggered - playing audio");

      // Randomly select an applause sound
      const randomSound =
        applauseSounds[Math.floor(Math.random() * applauseSounds.length)];
      console.log("🎵 Selected applause sound:", randomSound);

      // Use actual applause audio files from public/sounds directory
      audioRef.current.src = randomSound;
      audioRef.current.volume = volume / 100;

      // Play applause - this should work because it's triggered by a socket event
      // which is considered user interaction by the browser
      audioRef.current
        .play()
        .then(() => {
          console.log("🎵 Applause playing successfully via socket trigger");
        })
        .catch(error => {
          console.log("🎵 Applause playback failed:", error.message);
          // This is expected on first load before user interaction
        });
    } else if (isPlaying) {
      console.log("🎵 Applause triggered but no audio ref available");
    }
  }, [isPlaying, volume]);

  return <audio ref={audioRef} preload="none" style={{ display: "none" }} />;
}
