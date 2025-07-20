"use client";

import { useState, useEffect } from "react";
import { QueueItem } from "@/types";

interface NextSongSplashProps {
  nextSong: QueueItem;
  onComplete: () => void;
  duration?: number; // Duration in milliseconds
}

export function NextSongSplash({ 
  nextSong, 
  onComplete, 
  duration = 3000 
}: NextSongSplashProps) {
  const [countdown, setCountdown] = useState(Math.ceil(duration / 1000));
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-complete timer
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Allow fade out
    }, duration);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 z-50 flex items-center justify-center transition-opacity duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/20 rounded-full animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-blue-500/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-indigo-500/20 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="text-center max-w-4xl mx-auto px-8 relative z-10">
        {/* "Next Up" header */}
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-white mb-4 animate-fade-in">
            🎤 Next Up!
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto rounded-full" />
        </div>

        {/* Song information */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/10">
          <h2 className="text-4xl font-bold text-white mb-3 leading-tight">
            {nextSong.mediaItem.title}
          </h2>
          <p className="text-2xl text-gray-300 mb-4">
            by {nextSong.mediaItem.artist}
          </p>
          {nextSong.mediaItem.album && (
            <p className="text-lg text-gray-400 mb-4">
              from &ldquo;{nextSong.mediaItem.album}&rdquo;
            </p>
          )}
          
          {/* Singer info */}
          <div className="flex items-center justify-center space-x-4 text-lg">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Singer:</span>
              <span className="text-white font-semibold">{nextSong.addedBy}</span>
            </div>
            <div className="w-1 h-6 bg-gray-600 rounded-full" />
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Duration:</span>
              <span className="text-white">{formatDuration(nextSong.mediaItem.duration)}</span>
            </div>
          </div>
        </div>

        {/* Countdown and call to action */}
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-8xl font-bold text-white mb-2 tabular-nums">
              {countdown}
            </div>
            <p className="text-xl text-gray-300">
              {countdown > 0 ? "Get ready to sing!" : "Here we go!"}
            </p>
          </div>

          {/* Microphone reminder */}
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4 max-w-md mx-auto">
            <div className="flex items-center justify-center space-x-3">
              <span className="text-2xl">🎤</span>
              <span className="text-yellow-200 font-medium">
                Grab the microphone, {nextSong.addedBy}!
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="max-w-md mx-auto">
            <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-100"
                style={{ 
                  width: `${100 - ((countdown / Math.ceil(duration / 1000)) * 100)}%` 
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Skip hint */}
      <div className="absolute bottom-8 right-8 text-gray-400 text-sm">
        Press &quot;S&quot; to skip • Press &quot;Space&quot; to start early
      </div>
    </div>
  );
}
