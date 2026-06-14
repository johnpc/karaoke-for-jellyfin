// Types for the session management module
import { KaraokeSession, QueueItem, PlaybackState } from "@/types";

export type EventCallback = (data?: unknown) => void;

export const SESSION_EVENT_TYPES = [
  "session-created",
  "session-destroyed",
  "user-joined",
  "user-left",
  "queue-updated",
  "song-started",
  "song-ended",
  "playback-state-changed",
] as const;

export type SessionEventType = (typeof SESSION_EVENT_TYPES)[number];

export interface SessionStats {
  sessionId: string;
  sessionName: string;
  connectedUsers: number;
  totalSongs: number;
  pendingSongs: number;
  playingSongs: number;
  currentSong: QueueItem | null;
  isPlaying: boolean;
  createdAt: Date;
  lastActivity: Date;
}

export interface SessionState {
  session: KaraokeSession | null;
  skipInProgress: boolean;
  songTransitionInProgress: boolean;
  queueOperationInProgress: boolean;
}

export interface PlaybackUpdates {
  isPlaying?: boolean;
  currentTime?: number;
  volume?: number;
}
