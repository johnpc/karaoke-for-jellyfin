"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Playback position updates arrive in ~250ms steps. Between updates we
 * extrapolate with the wall clock so word highlighting moves smoothly.
 * Extrapolation is capped so a stalled clock cannot run away.
 */
export const MAX_EXTRAPOLATION_SECONDS = 1.5;

export function extrapolateTime(
  anchorTime: number,
  anchorAtMs: number,
  nowMs: number
): number {
  const elapsed = Math.max(0, (nowMs - anchorAtMs) / 1000);
  return anchorTime + Math.min(elapsed, MAX_EXTRAPOLATION_SECONDS);
}

/**
 * Returns `time` (seconds) smoothly advanced between updates while playing.
 * When paused the raw value is returned unchanged.
 */
export function useSmoothedTime(time: number, isPlaying: boolean): number {
  const [smoothed, setSmoothed] = useState(time);
  const anchorRef = useRef({ time, at: performance.now() });

  useEffect(() => {
    anchorRef.current = { time, at: performance.now() };
    setSmoothed(time);
  }, [time]);

  useEffect(() => {
    if (!isPlaying) return;

    let frame = 0;
    const tick = () => {
      const { time: anchorTime, at } = anchorRef.current;
      setSmoothed(extrapolateTime(anchorTime, at, performance.now()));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [isPlaying]);

  return isPlaying ? smoothed : time;
}
