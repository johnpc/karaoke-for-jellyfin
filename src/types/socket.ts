// WebSocket and API types — events, errors, and request/response shapes

import type { QueueItem, ConnectedUser, KaraokeSession } from "./session";
import type { PlaybackCommand, SongRating } from "./playback";
import type { LyricsSyncState } from "./media";

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: Record<string, unknown>;
  userId?: string;
  timestamp: Date;
}

export type WebSocketMessageType =
  | "queue-updated"
  | "song-started"
  | "song-ended"
  | "lyrics-sync"
  | "playback-control"
  | "user-joined"
  | "user-left"
  | "session-updated"
  | "error";

export interface WebSocketEvents {
  "queue-updated": (queue: QueueItem[]) => void;
  "song-started": (song: QueueItem) => void;
  "song-ended": (
    data:
      | QueueItem
      | { song: QueueItem; rating: SongRating; nextSong?: QueueItem }
  ) => void;
  "lyrics-sync": (syncState: LyricsSyncState) => void;
  "playback-control": (command: PlaybackCommand) => void;
  "user-joined": (user: ConnectedUser) => void;
  "user-left": (userId: string) => void;
  "session-updated": (session: Partial<KaraokeSession>) => void;
  error: (error: ErrorMessage) => void;
}

// Error types

export interface ErrorMessage {
  code: string;
  message: string;
  details?: string | Record<string, unknown>;
  timestamp: Date;
}

export type ErrorCode =
  | "JELLYFIN_CONNECTION_FAILED"
  | "SONG_NOT_FOUND"
  | "QUEUE_FULL"
  | "UNAUTHORIZED"
  | "INVALID_REQUEST"
  | "PLAYBACK_ERROR"
  | "LYRICS_NOT_FOUND"
  | "SESSION_NOT_FOUND";

// API types

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ErrorMessage;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SearchRequest {
  query: string;
  limit?: number;
  offset?: number;
  filters?: SearchFilters;
}

export interface SearchFilters {
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
  minDuration?: number;
  maxDuration?: number;
}

// Utility types

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

// Type guards for runtime type checking
export type TypeGuard<T> = (value: unknown) => value is T;
