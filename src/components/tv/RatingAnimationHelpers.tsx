"use client";

import { useState, useEffect, useCallback } from "react";
import { SongRating } from "@/types";

export type GradePrefix = "A" | "B" | "C" | "D";

export interface GradeStyle {
  textColor: string;
  bgColor: string;
  emoji: string;
}

export const GRADE_STYLES: Record<GradePrefix | "default", GradeStyle> = {
  A: {
    textColor: "text-green-400",
    bgColor: "bg-green-500/20 border-green-500/50",
    emoji: "\u{1f31f}",
  },
  B: {
    textColor: "text-blue-400",
    bgColor: "bg-blue-500/20 border-blue-500/50",
    emoji: "\u{1f44f}",
  },
  C: {
    textColor: "text-yellow-400",
    bgColor: "bg-yellow-500/20 border-yellow-500/50",
    emoji: "\u{1f44d}",
  },
  D: {
    textColor: "text-orange-400",
    bgColor: "bg-orange-500/20 border-orange-500/50",
    emoji: "\u{1f60a}",
  },
  default: {
    textColor: "text-red-400",
    bgColor: "bg-red-500/20 border-red-500/50",
    emoji: "\u{1f4aa}",
  },
};

export function getGradeStyle(grade: string): GradeStyle {
  const prefix = grade.charAt(0) as GradePrefix;
  return GRADE_STYLES[prefix] ?? GRADE_STYLES.default;
}

export type AnimationPhase = "spinning" | "revealing" | "celebrating";

export function useRatingAnimation(duration: number, onComplete: () => void) {
  const [phase, setPhase] = useState<AnimationPhase>("spinning");
  const [isVisible, setIsVisible] = useState(true);

  const stableOnComplete = useCallback(onComplete, [onComplete]);

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase("revealing"), 1500);
    const timer2 = setTimeout(() => setPhase("celebrating"), 2500);
    const timer3 = setTimeout(() => {
      setIsVisible(false);
      setTimeout(stableOnComplete, 300);
    }, duration);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [duration, stableOnComplete]);

  return { phase, isVisible };
}

export function ConfettiEffect() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-bounce"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${1 + Math.random()}s`,
          }}
        >
          ✨
        </div>
      ))}
    </div>
  );
}

export function SpinningPhase() {
  return (
    <div className="flex items-center justify-center">
      <div className="w-48 h-48 rounded-full border-8 border-gray-600 border-t-white animate-spin" />
    </div>
  );
}

export interface GradeRevealProps {
  rating: SongRating;
  phase: "revealing" | "celebrating";
}

export function GradeReveal({ rating, phase }: GradeRevealProps) {
  const style = getGradeStyle(rating.grade);
  const isCelebrating = phase === "celebrating";
  const isTopGrade = rating.grade.startsWith("A");

  return (
    <div
      className={`transform transition-all duration-500 ${
        isCelebrating ? "scale-110" : "scale-100"
      }`}
    >
      <div
        className={`w-48 h-48 rounded-full border-4 ${style.bgColor}
        flex items-center justify-center mx-auto mb-6 ${
          isCelebrating ? "animate-pulse" : ""
        }`}
      >
        <div className={`text-8xl font-bold ${style.textColor}`}>
          {rating.grade}
        </div>
      </div>

      <div data-testid="performance-rating" className="space-y-4">
        <div className="text-4xl">{style.emoji}</div>
        <h3 className="text-3xl font-bold text-white">{rating.message}</h3>
        <div data-testid="rating-score" className="text-gray-300">
          Score: {rating.score}/100
        </div>
      </div>

      {isCelebrating && isTopGrade && (
        <div className="absolute -inset-4 animate-ping rounded-full border-4 border-yellow-400/30" />
      )}
    </div>
  );
}
