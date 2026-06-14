import { useEffect } from "react";
import { TransitionState, PlaybackState, PlaybackCommand } from "@/types";
import { KeyboardHandlerState, KeyboardHandlerActions } from "./types";

function handleSpaceKey(
  state: KeyboardHandlerState,
  actions: KeyboardHandlerActions
): void {
  if (state.displayState === "applause") {
    actions.handleRatingComplete();
  } else if (state.displayState === "next-up") {
    actions.handleNextSongComplete();
  } else if (state.playbackState) {
    actions.playbackControl({
      action: state.playbackState.isPlaying ? "pause" : "play",
      userId: "tv-display",
      timestamp: new Date(),
    });
  }
}

function handleSkipKey(
  state: KeyboardHandlerState,
  actions: KeyboardHandlerActions
): void {
  if (state.displayState === "applause") {
    actions.handleRatingComplete();
  } else if (state.displayState === "next-up") {
    actions.handleNextSongComplete();
  } else {
    actions.skipSong();
  }
}

function handleKeyboardEvent(
  key: string,
  preventDefault: () => void,
  state: KeyboardHandlerState,
  actions: KeyboardHandlerActions
): void {
  switch (key) {
    case "h":
    case "H":
      actions.setShowHostControls(prev => !prev);
      break;
    case "q":
    case "Q":
      actions.setShowQueuePreview(prev => !prev);
      break;
    case " ":
      preventDefault();
      handleSpaceKey(state, actions);
      break;
    case "s":
    case "S":
      handleSkipKey(state, actions);
      break;
    case "Escape":
      actions.setShowHostControls(false);
      actions.setShowQueuePreview(false);
      break;
  }
}

interface UseKeyboardControlsParams {
  transitionState: TransitionState;
  playbackState: PlaybackState | null;
  setShowHostControls: React.Dispatch<React.SetStateAction<boolean>>;
  setShowQueuePreview: React.Dispatch<React.SetStateAction<boolean>>;
  handleRatingComplete: () => void;
  handleNextSongComplete: () => void;
  playbackControl: (command: PlaybackCommand) => void;
  skipSong: () => void;
}

export function useKeyboardControls(params: UseKeyboardControlsParams): void {
  const {
    transitionState,
    playbackState,
    setShowHostControls,
    setShowQueuePreview,
    handleRatingComplete,
    handleNextSongComplete,
    playbackControl,
    skipSong,
  } = params;

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      handleKeyboardEvent(
        event.key,
        () => event.preventDefault(),
        {
          displayState: transitionState.displayState,
          playbackState,
        },
        {
          setShowHostControls,
          setShowQueuePreview,
          handleRatingComplete,
          handleNextSongComplete,
          playbackControl,
          skipSong,
        }
      );
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    playbackState,
    playbackControl,
    skipSong,
    transitionState.displayState,
    handleRatingComplete,
    handleNextSongComplete,
    setShowHostControls,
    setShowQueuePreview,
  ]);
}
