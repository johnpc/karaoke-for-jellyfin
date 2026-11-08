import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AudioPlayer } from "@/components/tv/AudioPlayer";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

vi.mock("@/hooks/useAudioPlayer", () => ({
  useAudioPlayer: vi.fn(),
}));

const mockedUseAudioPlayer = vi.mocked(useAudioPlayer);

type HookReturn = ReturnType<typeof useAudioPlayer>;

function hookReturn(overrides: Partial<HookReturn> = {}): HookReturn {
  return {
    audioRef: { current: null },
    isLoading: false,
    error: null,
    needsUserGesture: false,
    startPlaybackFromGesture: vi.fn(),
    ...overrides,
  };
}

const props = {
  song: null,
  playbackState: null,
  onPlaybackControl: vi.fn(),
  onSongEnded: vi.fn(),
  onTimeUpdate: vi.fn(),
};

describe("AudioPlayer tap-to-start overlay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is hidden while the browser allows autoplay", () => {
    mockedUseAudioPlayer.mockReturnValue(hookReturn());

    render(<AudioPlayer {...props} />);

    expect(screen.queryByTestId("audio-unlock")).not.toBeInTheDocument();
  });

  it("appears when the browser blocked autoplay", () => {
    mockedUseAudioPlayer.mockReturnValue(
      hookReturn({ needsUserGesture: true })
    );

    render(<AudioPlayer {...props} />);

    expect(screen.getByTestId("audio-unlock")).toHaveTextContent(
      "Tap to start audio"
    );
  });

  it("starts playback from the tap handler", () => {
    const startPlaybackFromGesture = vi.fn();
    mockedUseAudioPlayer.mockReturnValue(
      hookReturn({ needsUserGesture: true, startPlaybackFromGesture })
    );

    render(<AudioPlayer {...props} />);
    fireEvent.click(screen.getByTestId("audio-unlock"));

    expect(startPlaybackFromGesture).toHaveBeenCalledTimes(1);
  });

  it("does not show a stale error while waiting for the tap", () => {
    mockedUseAudioPlayer.mockReturnValue(
      hookReturn({ needsUserGesture: true, error: "Play failed: old" })
    );

    render(<AudioPlayer {...props} />);

    expect(screen.queryByTestId("audio-error")).not.toBeInTheDocument();
  });

  it("still shows real playback errors", () => {
    mockedUseAudioPlayer.mockReturnValue(
      hookReturn({ error: "Failed to load audio" })
    );

    render(<AudioPlayer {...props} />);

    expect(screen.getByTestId("audio-error")).toHaveTextContent(
      "Audio Error: Failed to load audio"
    );
  });
});
