import {
  TransitionState,
  QueueItem,
  PlaybackState,
  PlaybackCommand,
  KaraokeSession,
} from "@/types";

export interface UseTVDisplayReturn {
  // State
  isClient: boolean;
  isConnected: boolean;
  error: string | null;
  session: KaraokeSession | null;
  queue: QueueItem[];
  currentSong: QueueItem | null;
  playbackState: PlaybackState | null;
  showHostControls: boolean;
  showQueuePreview: boolean;
  autoplayCountdown: number | null;
  transitionState: TransitionState;

  // State setters
  setShowHostControls: (value: boolean) => void;
  setShowQueuePreview: (value: boolean) => void;

  // Handlers
  handleRatingComplete: () => void;
  handleNextSongComplete: () => void;
  handleEmergencyStop: () => void;
  handleSongEnded: () => void;
  handleTimeUpdate: (currentTime: number) => void;

  // WebSocket actions
  skipSong: () => void;
  playbackControl: (command: PlaybackCommand) => void;
  removeSong: (queueItemId: string) => void;
  reorderQueue: (queueItemId: string, newPosition: number) => void;
}

export interface KeyboardHandlerState {
  displayState: TransitionState["displayState"];
  playbackState: PlaybackState | null;
}

export interface KeyboardHandlerActions {
  setShowHostControls: React.Dispatch<React.SetStateAction<boolean>>;
  setShowQueuePreview: React.Dispatch<React.SetStateAction<boolean>>;
  handleRatingComplete: () => void;
  handleNextSongComplete: () => void;
  playbackControl: (command: PlaybackCommand) => void;
  skipSong: () => void;
}

export interface AutoplayConditions {
  currentSong: QueueItem | null;
  isConnected: boolean;
  playbackState: PlaybackState | null;
  hasTriggeredAutoPlay: boolean;
  displayState: TransitionState["displayState"];
}

export interface FallbackAutoplayConditions {
  currentSong: QueueItem | null;
  queue: QueueItem[];
  isConnected: boolean;
  session: KaraokeSession | null;
  autoplayCountdown: number | null;
  autoplayTriggered: boolean;
}

export interface UseAutoplayParams {
  currentSong: QueueItem | null;
  queue: QueueItem[];
  isConnected: boolean;
  session: KaraokeSession | null;
  playbackState: PlaybackState | null;
  transitionState: TransitionState;
  playbackControl: (command: PlaybackCommand) => void;
  autoplayDelay: number;
}

export interface UseAutoplayReturn {
  autoplayCountdown: number | null;
}
