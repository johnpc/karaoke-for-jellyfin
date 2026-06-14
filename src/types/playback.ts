// Playback types — state, commands, events, TV display, and ratings

import type { QueueItem } from "./session";

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number; // seconds
  volume: number; // 0-100
  isMuted: boolean;
  playbackRate: number; // 1.0 = normal speed
  lyricsOffset: number; // seconds, -10 to +10
}

export type PlaybackAction =
  | "play"
  | "pause"
  | "stop"
  | "skip"
  | "previous"
  | "seek"
  | "volume"
  | "mute"
  | "time-update"
  | "lyrics-offset";

export interface PlaybackCommand {
  action: PlaybackAction;
  value?: number; // for seek (seconds) or volume (0-100)
  userId: string;
  timestamp: Date;
}

export interface PlaybackEvent {
  type: PlaybackEventType;
  songId?: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export type PlaybackEventType =
  | "song-started"
  | "song-ended"
  | "song-paused"
  | "song-resumed"
  | "song-skipped"
  | "volume-changed"
  | "seek-performed";

// TV Display types

export type TVDisplayState =
  | "waiting" // No songs in queue
  | "playing" // Song is currently playing
  | "applause" // Showing applause and rating after song
  | "next-up" // Showing next song splash screen
  | "transitioning"; // Brief transition state

export interface SongRating {
  grade: string; // A+, A, A-, B+, B, B-, C+, C, C-, D+, D, F
  score: number; // 0-100
  message: string; // "Fantastic!", "Great job!", etc.
}

export interface TransitionState {
  displayState: TVDisplayState;
  completedSong?: QueueItem;
  nextSong?: QueueItem;
  rating?: SongRating;
  transitionStartTime?: number;
}
