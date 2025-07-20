"use client";

import { useState, useEffect } from "react";
import { SongRating, QueueItem } from "@/types";

interface RatingAnimationProps {
  song: QueueItem;
  rating: SongRating;
  onComplete: () => void;
  duration?: number; // Duration in milliseconds
}

export function RatingAnimation({ 
  song, 
  rating, 
  onComplete, 
  duration = 4000 
}: RatingAnimationProps) {
  const [phase, setPhase] = useState<'spinning' | 'revealing' | 'celebrating'>('spinning');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setPhase('revealing');
    }, 1500); // Spin for 1.5 seconds

    const timer2 = setTimeout(() => {
      setPhase('celebrating');
    }, 2500); // Reveal for 1 second

    const timer3 = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Allow fade out
    }, duration);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [duration, onComplete]);

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-400';
    if (grade.startsWith('B')) return 'text-blue-400';
    if (grade.startsWith('C')) return 'text-yellow-400';
    if (grade.startsWith('D')) return 'text-orange-400';
    return 'text-red-400';
  };

  const getGradeBgColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-500/20 border-green-500/50';
    if (grade.startsWith('B')) return 'bg-blue-500/20 border-blue-500/50';
    if (grade.startsWith('C')) return 'bg-yellow-500/20 border-yellow-500/50';
    if (grade.startsWith('D')) return 'bg-orange-500/20 border-orange-500/50';
    return 'bg-red-500/20 border-red-500/50';
  };

  const getEmoji = (grade: string) => {
    if (grade.startsWith('A')) return '🌟';
    if (grade.startsWith('B')) return '👏';
    if (grade.startsWith('C')) return '👍';
    if (grade.startsWith('D')) return '😊';
    return '💪';
  };

  return (
    <div className={`fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Background particles/confetti effect for high grades */}
      {rating.grade.startsWith('A') && phase === 'celebrating' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            >
              ✨
            </div>
          ))}
        </div>
      )}

      <div className="text-center max-w-2xl mx-auto px-8">
        {/* Song completion message */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Great performance!
          </h2>
          <p className="text-gray-300 text-lg">
            &ldquo;{song.mediaItem.title}&rdquo; by {song.mediaItem.artist}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Performed by {song.addedBy}
          </p>
        </div>

        {/* Rating display */}
        <div className="relative">
          {/* Spinning placeholder */}
          {phase === 'spinning' && (
            <div className="flex items-center justify-center">
              <div className={`w-48 h-48 rounded-full border-8 border-gray-600 border-t-white animate-spin`} />
            </div>
          )}

          {/* Grade reveal */}
          {(phase === 'revealing' || phase === 'celebrating') && (
            <div className={`transform transition-all duration-500 ${
              phase === 'celebrating' ? 'scale-110' : 'scale-100'
            }`}>
              {/* Grade circle */}
              <div className={`w-48 h-48 rounded-full border-4 ${getGradeBgColor(rating.grade)} 
                flex items-center justify-center mx-auto mb-6 ${
                phase === 'celebrating' ? 'animate-pulse' : ''
              }`}>
                <div className={`text-8xl font-bold ${getGradeColor(rating.grade)}`}>
                  {rating.grade}
                </div>
              </div>

              {/* Rating message */}
              <div className="space-y-4">
                <div className="text-4xl">
                  {getEmoji(rating.grade)}
                </div>
                <h3 className="text-3xl font-bold text-white">
                  {rating.message}
                </h3>
                <div className="text-gray-300">
                  Score: {rating.score}/100
                </div>
              </div>

              {/* Celebration effects */}
              {phase === 'celebrating' && rating.grade.startsWith('A') && (
                <div className="absolute -inset-4 animate-ping rounded-full border-4 border-yellow-400/30" />
              )}
            </div>
          )}
        </div>

        {/* Progress indicator */}
        <div className="mt-12">
          <div className="w-64 h-2 bg-gray-700 rounded-full mx-auto overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-100"
              style={{ 
                width: `${((Date.now() % duration) / duration) * 100}%` 
              }}
            />
          </div>
          <p className="text-gray-400 text-sm mt-2">
            Next song coming up...
          </p>
        </div>
      </div>
    </div>
  );
}
