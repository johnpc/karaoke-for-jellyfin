import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApplausePlayer } from "@/components/tv/ApplausePlayer";

describe("ApplausePlayer", () => {
  let mockPlay: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPlay = vi.fn().mockResolvedValue(undefined);

    // Mock HTMLAudioElement play/pause
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: mockPlay,
    });
  });

  it("renders without crashing", () => {
    render(<ApplausePlayer isPlaying={false} />);
    expect(screen.getByTestId("applause-animation")).toBeInTheDocument();
  });

  it("renders a hidden audio element", () => {
    render(<ApplausePlayer isPlaying={false} />);
    const audio = screen.getByTestId("applause-animation");
    expect(audio.tagName).toBe("AUDIO");
    expect(audio).toHaveStyle({ display: "none" });
  });

  it("attempts to play audio when isPlaying becomes true", () => {
    render(<ApplausePlayer isPlaying={true} />);
    expect(mockPlay).toHaveBeenCalled();
  });

  it("does not play audio when isPlaying is false", () => {
    render(<ApplausePlayer isPlaying={false} />);
    expect(mockPlay).not.toHaveBeenCalled();
  });

  it("sets volume based on the volume prop", () => {
    render(<ApplausePlayer isPlaying={true} volume={50} />);
    const audio = screen.getByTestId("applause-animation") as HTMLAudioElement;
    expect(audio.volume).toBe(0.5);
  });

  it("uses default volume of 70%", () => {
    render(<ApplausePlayer isPlaying={true} />);
    const audio = screen.getByTestId("applause-animation") as HTMLAudioElement;
    expect(audio.volume).toBe(0.7);
  });
});
