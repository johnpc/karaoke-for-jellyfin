// Session types — karaoke session, queue, users, and settings

import type { PlaybackState } from "./playback";
import type { MediaItem } from "./media";

export interface QueueItem {
  id: string;
  mediaItem: MediaItem;
  addedBy: string;
  addedAt: Date;
  position: number;
  status: QueueItemStatus;
}

export type QueueItemStatus = "pending" | "playing" | "completed" | "skipped";

export interface QueueOperationResult {
  success: boolean;
  message: string;
  queueItem?: QueueItem;
  newQueue?: QueueItem[];
}

export interface KaraokeSession {
  id: string;
  name: string;
  queue: QueueItem[];
  currentSong: QueueItem | null;
  playbackState: PlaybackState;
  connectedUsers: ConnectedUser[];
  hostControls: HostControls;
  settings: SessionSettings;
  createdAt: Date;
  lastActivity: Date;
}

export interface ConnectedUser {
  id: string;
  name: string;
  isHost: boolean;
  connectedAt: Date;
  lastSeen: Date;
  socketId?: string;
}

export interface HostControls {
  autoAdvance: boolean;
  allowUserSkip: boolean;
  allowUserRemove: boolean;
  maxSongsPerUser: number;
  requireApproval: boolean;
}

export interface SessionSettings {
  displayName: string;
  description?: string;
  isPublic: boolean;
  maxUsers: number;
  lyricsEnabled: boolean;
  crossfadeEnabled: boolean;
  crossfadeDuration: number; // seconds
}
