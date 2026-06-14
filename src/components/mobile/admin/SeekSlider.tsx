"use client";

import { useState } from "react";

interface SeekSliderProps {
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
}

export function SeekSlider({ currentTime, duration, onSeek }: SeekSliderProps) {
  const [dragTime, setDragTime] = useState<number | null>(null);
  const displayTime = dragTime ?? currentTime;

  const commitSeek = () => {
    if (dragTime !== null) onSeek(dragTime);
    setDragTime(null);
  };

  return (
    <div data-testid="seek-control" className="mb-4">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>
          {Math.floor(displayTime / 60)}:
          {String(Math.floor(displayTime % 60)).padStart(2, "0")}
        </span>
        <span>
          {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, "0")}
        </span>
      </div>
      <input
        data-testid="seek-slider"
        type="range"
        min="0"
        max={duration}
        value={displayTime}
        onMouseDown={() => setDragTime(currentTime)}
        onTouchStart={() => setDragTime(currentTime)}
        onChange={e => setDragTime(parseInt(e.target.value))}
        onMouseUp={commitSeek}
        onTouchEnd={commitSeek}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}
