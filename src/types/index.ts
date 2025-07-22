// Core data models for Karaoke For Jellyfin

// ============================================================================
// MEDIA TYPES
// ============================================================================

export interface MediaItem {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  jellyfinId: string;
  streamUrl: string;
  lyricsPath?: string;
  hasLyrics?: boolean; // From Jellyfin's HasLyrics field
  metadata?: MediaMetadata;
}

export interface Artist {
  id: string;
  name: string;
  jellyfinId: string;
  imageUrl?: string;
  songCount?: number;
}

export interface Playlist {
  id: string;
  name: string;
  jellyfinId: string;
  imageUrl?: string;
  trackCount?: number;
  description?: string;
  createdBy?: string;
  createdAt?: Date;
}

export interface MediaMetadata {
  genre?: string;
  year?: number;
  trackNumber?: number;
  discNumber?: number;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  fileSize?: number;
  format?: string;
}

// ============================================================================
// QUEUE TYPES
// ============================================================================

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

// ============================================================================
// LYRICS TYPES
// ============================================================================

export interface LyricsLine {
  timestamp: number; // milliseconds from start
  text: string;
  duration?: number; // milliseconds
  isChorus?: boolean;
  isVerse?: boolean;
}

export interface LyricsFile {
  songId: string;
  lines: LyricsLine[];
  format: LyricsFormat;
  metadata?: LyricsMetadata;
}

export interface LyricsMetadata {
  title?: string;
  artist?: string;
  album?: string;
  length?: number;
  offset?: number; // global timing offset in milliseconds
  creator?: string;
  version?: string;
}

export type LyricsFormat = "lrc" | "srt" | "txt" | "vtt";

export interface LyricsSyncState {
  currentLine: number;
  currentTimestamp: number;
  isActive: boolean;
  nextLine?: LyricsLine;
}

// ============================================================================
// SESSION TYPES
// ============================================================================

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

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number; // seconds
  volume: number; // 0-100
  isMuted: boolean;
  playbackRate: number; // 1.0 = normal speed
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

// ============================================================================
// PLAYBACK TYPES
// ============================================================================

export type PlaybackAction =
  | "play"
  | "pause"
  | "stop"
  | "skip"
  | "previous"
  | "seek"
  | "volume"
  | "mute"
  | "time-update";

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
  data?: any;
}

export type PlaybackEventType =
  | "song-started"
  | "song-ended"
  | "song-paused"
  | "song-resumed"
  | "song-skipped"
  | "volume-changed"
  | "seek-performed";

// ============================================================================
// TV DISPLAY TYPES
// ============================================================================

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

// ============================================================================
// WEBSOCKET TYPES
// ============================================================================

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
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
      | { song: QueueItem; rating: SongRating; nextSong?: QueueItem },
  ) => void;
  "lyrics-sync": (syncState: LyricsSyncState) => void;
  "playback-control": (command: PlaybackCommand) => void;
  "user-joined": (user: ConnectedUser) => void;
  "user-left": (userId: string) => void;
  "session-updated": (session: Partial<KaraokeSession>) => void;
  error: (error: ErrorMessage) => void;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ErrorMessage {
  code: string;
  message: string;
  details?: any;
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

// ============================================================================
// API TYPES
// ============================================================================

export interface ApiResponse<T = any> {
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

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

// Type guards for runtime type checking
export type TypeGuard<T> = (value: any) => value is T;
