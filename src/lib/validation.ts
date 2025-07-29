// Validation functions for Karaoke For Jellyfin data models
import {
  MediaItem,
  QueueItem,
  KaraokeSession,
  ConnectedUser,
  LyricsLine,
  LyricsFile,
  PlaybackCommand,
  SearchRequest,
  TypeGuard,
  ErrorCode,
  ErrorMessage,
} from "@/types";

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export class ValidationError extends Error {
  constructor(
    message: string,
    public code: ErrorCode = "INVALID_REQUEST",
    public field?: string
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export function createErrorMessage(
  code: ErrorCode,
  message: string,
  details?: any
): ErrorMessage {
  return {
    code,
    message,
    details,
    timestamp: new Date(),
  };
}

// ============================================================================
// BASIC TYPE GUARDS
// ============================================================================

export const isString: TypeGuard<string> = (value): value is string => {
  return typeof value === "string";
};

export const isNumber: TypeGuard<number> = (value): value is number => {
  return typeof value === "number" && !isNaN(value);
};

export const isPositiveNumber: TypeGuard<number> = (value): value is number => {
  return isNumber(value) && value > 0;
};

export const isNonNegativeNumber: TypeGuard<number> = (
  value
): value is number => {
  return isNumber(value) && value >= 0;
};

export const isValidDate: TypeGuard<Date> = (value): value is Date => {
  return value instanceof Date && !isNaN(value.getTime());
};

export const isValidUrl: TypeGuard<string> = (value): value is string => {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

// ============================================================================
// MEDIA ITEM VALIDATION
// ============================================================================

export const isValidMediaItem: TypeGuard<MediaItem> = (
  value
): value is MediaItem => {
  if (!value || typeof value !== "object") return false;

  return (
    isString(value.id) &&
    value.id.length > 0 &&
    isString(value.title) &&
    value.title.length > 0 &&
    isString(value.artist) &&
    value.artist.length > 0 &&
    isPositiveNumber(value.duration) &&
    isString(value.jellyfinId) &&
    value.jellyfinId.length > 0 &&
    isValidUrl(value.streamUrl) &&
    (value.album === undefined || isString(value.album)) &&
    (value.lyricsPath === undefined || isString(value.lyricsPath))
  );
};

export function validateMediaItem(item: any): MediaItem {
  if (!isValidMediaItem(item)) {
    throw new ValidationError("Invalid media item format");
  }
  return item;
}

// ============================================================================
// QUEUE ITEM VALIDATION
// ============================================================================

export const isValidQueueItem: TypeGuard<QueueItem> = (
  value
): value is QueueItem => {
  if (!value || typeof value !== "object") return false;

  const validStatuses = ["pending", "playing", "completed", "skipped"];

  return (
    isString(value.id) &&
    value.id.length > 0 &&
    isValidMediaItem(value.mediaItem) &&
    isString(value.addedBy) &&
    value.addedBy.length > 0 &&
    isValidDate(value.addedAt) &&
    isNonNegativeNumber(value.position) &&
    validStatuses.includes(value.status)
  );
};

export function validateQueueItem(item: any): QueueItem {
  if (!isValidQueueItem(item)) {
    throw new ValidationError("Invalid queue item format");
  }
  return item;
}

// ============================================================================
// USER VALIDATION
// ============================================================================

export const isValidConnectedUser: TypeGuard<ConnectedUser> = (
  value
): value is ConnectedUser => {
  if (!value || typeof value !== "object") return false;

  return (
    isString(value.id) &&
    value.id.length > 0 &&
    isString(value.name) &&
    value.name.length > 0 &&
    typeof value.isHost === "boolean" &&
    isValidDate(value.connectedAt) &&
    isValidDate(value.lastSeen) &&
    (value.socketId === undefined || isString(value.socketId))
  );
};

export function validateConnectedUser(user: any): ConnectedUser {
  if (!isValidConnectedUser(user)) {
    throw new ValidationError("Invalid connected user format");
  }
  return user;
}

// ============================================================================
// LYRICS VALIDATION
// ============================================================================

export const isValidLyricsLine: TypeGuard<LyricsLine> = (
  value
): value is LyricsLine => {
  if (!value || typeof value !== "object") return false;

  return (
    isNonNegativeNumber(value.timestamp) &&
    isString(value.text) &&
    (value.duration === undefined || isPositiveNumber(value.duration)) &&
    (value.isChorus === undefined || typeof value.isChorus === "boolean") &&
    (value.isVerse === undefined || typeof value.isVerse === "boolean")
  );
};

export const isValidLyricsFile: TypeGuard<LyricsFile> = (
  value
): value is LyricsFile => {
  if (!value || typeof value !== "object") return false;

  const validFormats = ["lrc", "srt", "txt", "vtt"];

  return (
    isString(value.songId) &&
    value.songId.length > 0 &&
    Array.isArray(value.lines) &&
    value.lines.every(isValidLyricsLine) &&
    validFormats.includes(value.format)
  );
};

export function validateLyricsFile(lyrics: any): LyricsFile {
  if (!isValidLyricsFile(lyrics)) {
    throw new ValidationError("Invalid lyrics file format");
  }
  return lyrics;
}

// ============================================================================
// PLAYBACK VALIDATION
// ============================================================================

export const isValidPlaybackCommand: TypeGuard<PlaybackCommand> = (
  value
): value is PlaybackCommand => {
  if (!value || typeof value !== "object") return false;

  const validActions = [
    "play",
    "pause",
    "stop",
    "skip",
    "previous",
    "seek",
    "volume",
    "mute",
  ];

  return (
    validActions.includes(value.action) &&
    isString(value.userId) &&
    value.userId.length > 0 &&
    isValidDate(value.timestamp) &&
    (value.value === undefined || isNonNegativeNumber(value.value))
  );
};

export function validatePlaybackCommand(command: any): PlaybackCommand {
  if (!isValidPlaybackCommand(command)) {
    throw new ValidationError("Invalid playback command format");
  }

  // Additional validation based on action type
  if (command.action === "volume" && command.value !== undefined) {
    if (command.value < 0 || command.value > 100) {
      throw new ValidationError(
        "Volume must be between 0 and 100",
        "INVALID_REQUEST",
        "value"
      );
    }
  }

  if (command.action === "seek" && command.value !== undefined) {
    if (command.value < 0) {
      throw new ValidationError(
        "Seek position cannot be negative",
        "INVALID_REQUEST",
        "value"
      );
    }
  }

  return command;
}

// ============================================================================
// SEARCH VALIDATION
// ============================================================================

export const isValidSearchRequest: TypeGuard<SearchRequest> = (
  value
): value is SearchRequest => {
  if (!value || typeof value !== "object") return false;

  return (
    isString(value.query) &&
    value.query.trim().length > 0 &&
    (value.limit === undefined ||
      (isPositiveNumber(value.limit) && value.limit <= 1000)) &&
    (value.offset === undefined || isNonNegativeNumber(value.offset))
  );
};

export function validateSearchRequest(request: any): SearchRequest {
  if (!isValidSearchRequest(request)) {
    throw new ValidationError("Invalid search request format");
  }

  // Sanitize query
  request.query = request.query.trim();

  // Set defaults
  if (request.limit === undefined) request.limit = 50;
  if (request.offset === undefined) request.offset = 0;

  return request;
}

// ============================================================================
// SESSION VALIDATION
// ============================================================================

export function validateSessionName(name: string): string {
  if (!isString(name) || name.trim().length === 0) {
    throw new ValidationError(
      "Session name is required",
      "INVALID_REQUEST",
      "name"
    );
  }

  if (name.length > 100) {
    throw new ValidationError(
      "Session name must be 100 characters or less",
      "INVALID_REQUEST",
      "name"
    );
  }

  return name.trim();
}

export function validateUserName(name: string): string {
  if (!isString(name) || name.trim().length === 0) {
    throw new ValidationError(
      "User name is required",
      "INVALID_REQUEST",
      "name"
    );
  }

  if (name.length > 50) {
    throw new ValidationError(
      "User name must be 50 characters or less",
      "INVALID_REQUEST",
      "name"
    );
  }

  // Remove potentially harmful characters
  const sanitized = name.trim().replace(/[<>\"'&]/g, "");

  if (sanitized.length === 0) {
    throw new ValidationError(
      "User name contains only invalid characters",
      "INVALID_REQUEST",
      "name"
    );
  }

  return sanitized;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function sanitizeString(
  input: string,
  maxLength: number = 1000
): string {
  if (!isString(input)) return "";

  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>\"'&]/g, ""); // Remove potentially harmful characters
}

export function formatDuration(seconds: number): string {
  if (!isNonNegativeNumber(seconds)) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function parseDuration(durationString: string): number {
  if (!isString(durationString)) return 0;

  const parts = durationString.split(":").map(part => parseInt(part, 10));

  if (parts.length === 2 && parts.every(isNumber)) {
    return parts[0] * 60 + parts[1];
  }

  return 0;
}

// ============================================================================
// QUEUE UTILITIES
// ============================================================================

export function validateQueuePosition(
  position: number,
  queueLength: number
): number {
  if (!isNonNegativeNumber(position)) {
    throw new ValidationError(
      "Queue position must be a non-negative number",
      "INVALID_REQUEST",
      "position"
    );
  }

  if (position >= queueLength) {
    return queueLength;
  }

  return Math.floor(position);
}

export function reorderQueue(
  queue: QueueItem[],
  fromIndex: number,
  toIndex: number
): QueueItem[] {
  if (!Array.isArray(queue)) return [];

  const newQueue = [...queue];
  const [movedItem] = newQueue.splice(fromIndex, 1);
  newQueue.splice(toIndex, 0, movedItem);

  // Update positions
  return newQueue.map((item, index) => ({
    ...item,
    position: index,
  }));
}
