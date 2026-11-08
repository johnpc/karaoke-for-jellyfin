import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useSmoothedTime,
  extrapolateTime,
  MAX_EXTRAPOLATION_SECONDS,
} from "@/hooks/useSmoothedTime";

describe("extrapolateTime", () => {
  it("advances by elapsed wall-clock seconds", () => {
    expect(extrapolateTime(10, 1000, 1300)).toBeCloseTo(10.3);
  });

  it("never moves backwards", () => {
    expect(extrapolateTime(10, 1000, 500)).toBe(10);
  });

  it("caps extrapolation", () => {
    expect(extrapolateTime(10, 1000, 60000)).toBe(
      10 + MAX_EXTRAPOLATION_SECONDS
    );
  });
});

describe("useSmoothedTime", () => {
  let frames: FrameRequestCallback[];
  let now: number;
  const cancel = vi.fn();

  beforeEach(() => {
    frames = [];
    now = 1000;
    cancel.mockClear();
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((cb: FrameRequestCallback) => {
        frames.push(cb);
        return frames.length;
      })
    );
    vi.stubGlobal("cancelAnimationFrame", cancel);
    vi.spyOn(performance, "now").mockImplementation(() => now);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const runFrame = () => {
    const cb = frames.shift();
    if (cb) act(() => cb(now));
  };

  it("returns the raw time when paused and schedules no frames", () => {
    const { result } = renderHook(() => useSmoothedTime(10, false));
    expect(result.current).toBe(10);
    expect(frames).toHaveLength(0);
  });

  it("extrapolates between updates while playing", () => {
    const { result } = renderHook(() => useSmoothedTime(10, true));
    expect(result.current).toBe(10);

    now = 1300;
    runFrame();
    expect(result.current).toBeCloseTo(10.3);

    now = 1600;
    runFrame();
    expect(result.current).toBeCloseTo(10.6);
  });

  it("caps extrapolation when updates stall", () => {
    const { result } = renderHook(() => useSmoothedTime(10, true));
    now = 1000 + 10_000;
    runFrame();
    expect(result.current).toBe(10 + MAX_EXTRAPOLATION_SECONDS);
  });

  it("re-anchors when a new time arrives", () => {
    const { result, rerender } = renderHook(
      ({ time }) => useSmoothedTime(time, true),
      { initialProps: { time: 10 } }
    );
    now = 1400;
    runFrame();
    expect(result.current).toBeCloseTo(10.4);

    rerender({ time: 20 });
    expect(result.current).toBe(20);

    now = 1500;
    runFrame();
    expect(result.current).toBeCloseTo(20.1);
  });

  it("cancels the animation frame on unmount", () => {
    const { unmount } = renderHook(() => useSmoothedTime(10, true));
    unmount();
    expect(cancel).toHaveBeenCalled();
  });
});
