"use client";

import { QueueItem, SongRating } from "@/types";
import {
  useRatingAnimation,
  ConfettiEffect,
  SpinningPhase,
  GradeReveal,
} from "@/components/tv/RatingAnimationHelpers";

interface RatingAnimationProps {
  song: QueueItem;
  rating: SongRating;
  nextSong?: QueueItem | null;
  onComplete: () => void;
  duration?: number;
}

export function RatingAnimation({
  song,
  rating,
  nextSong,
  onComplete,
  duration = 4000,
}: RatingAnimationProps) {
  const { phase, isVisible } = useRatingAnimation(duration, onComplete);

  const showConfetti = rating.grade.startsWith("A") && phase === "celebrating";

  return (
    <div
      data-testid="rating-animation"
      className={`fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {showConfetti && <ConfettiEffect />}

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
          {phase === "spinning" && <SpinningPhase />}
          {(phase === "revealing" || phase === "celebrating") && (
            <GradeReveal rating={rating} phase={phase} />
          )}
        </div>

        {/* Next up / Progress indicator */}
        <div className="mt-12" data-testid="rating-next-up">
          {nextSong ? (
            <div className="mb-4">
              <p className="text-gray-400 text-sm uppercase tracking-wide mb-2">
                Up Next
              </p>
              <p className="text-white text-xl font-semibold">
                {nextSong.mediaItem.title}
              </p>
              <p className="text-gray-300 text-base">
                {nextSong.mediaItem.artist}
              </p>
              <p className="text-purple-400 text-sm mt-1">
                🎤 {nextSong.addedBy}
              </p>
            </div>
          ) : (
            <p className="text-gray-400 text-sm mb-4">No more songs in queue</p>
          )}
          <div className="w-64 h-2 bg-gray-700 rounded-full mx-auto overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-100"
              style={{
                width: `${((Date.now() % duration) / duration) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
