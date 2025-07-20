"use client";

import { useEffect, useRef } from "react";

interface ApplausePlayerProps {
  isPlaying: boolean;
  volume?: number; // 0-100
}

export function ApplausePlayer({ 
  isPlaying,
  volume = 70
}: ApplausePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  // Array of applause sound variations
  const applauseSounds = [
    '/sounds/applause-1.mp3',
    '/sounds/applause-2.mp3', 
    '/sounds/applause-3.mp3',
    '/sounds/applause-crowd.mp3'
  ];

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      // Randomly select an applause sound
      const randomSound = applauseSounds[Math.floor(Math.random() * applauseSounds.length)];
      
      // For now, we'll use a data URL for a simple applause-like sound
      // In production, you'd want to add actual applause audio files to the public/sounds directory
      audioRef.current.src = generateApplauseDataUrl();
      audioRef.current.volume = volume / 100;
      
      // Play applause - this should work because it's triggered by a socket event
      // which is considered user interaction by the browser
      audioRef.current.play().then(() => {
        console.log('Applause playing successfully via socket trigger');
      }).catch((error) => {
        console.log('Applause playback failed:', error.message);
        // This is expected on first load before user interaction
      });
    }
  }, [isPlaying, volume]);

  // Generate a simple applause-like sound using Web Audio API
  const generateApplauseDataUrl = () => {
    // This is a placeholder - in a real app you'd use actual applause audio files
    // For now, we'll return a data URL for a simple tone
    const sampleRate = 44100;
    const duration = 3; // 3 seconds
    const samples = sampleRate * duration;
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples * 2, true);
    
    // Generate applause-like noise
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      // Create applause-like sound with random noise and envelope
      const envelope = Math.exp(-t * 2) * (1 - Math.exp(-t * 10));
      const noise = (Math.random() - 0.5) * 2;
      const sample = noise * envelope * 0.3;
      const intSample = Math.max(-32768, Math.min(32767, sample * 32767));
      view.setInt16(44 + i * 2, intSample, true);
    }
    
    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  };

  return (
    <audio
      ref={audioRef}
      preload="none"
      style={{ display: 'none' }}
    />
  );
}
