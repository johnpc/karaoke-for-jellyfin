// Barrel re-export — all types available from "@/types"

export type {
  MediaItem,
  Artist,
  Album,
  Playlist,
  MediaMetadata,
  LyricsLine,
  LyricsFile,
  LyricsMetadata,
  LyricsFormat,
  LyricsSyncState,
} from "./media";

export type {
  QueueItem,
  QueueItemStatus,
  QueueOperationResult,
  KaraokeSession,
  ConnectedUser,
  HostControls,
  SessionSettings,
} from "./session";

export type {
  PlaybackState,
  PlaybackAction,
  PlaybackCommand,
  PlaybackEvent,
  PlaybackEventType,
  TVDisplayState,
  SongRating,
  TransitionState,
} from "./playback";

export type {
  WebSocketMessage,
  WebSocketMessageType,
  WebSocketEvents,
  ErrorMessage,
  ErrorCode,
  ApiResponse,
  PaginatedResponse,
  SearchRequest,
  SearchFilters,
  DeepPartial,
  RequiredFields,
  OptionalFields,
  TypeGuard,
} from "./socket";
