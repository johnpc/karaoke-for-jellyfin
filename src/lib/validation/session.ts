// Session, user, and lyrics validation
import { ConnectedUser, LyricsLine, LyricsFile, TypeGuard } from "@/types";
import {
  ValidationError,
  isString,
  isPositiveNumber,
  isNonNegativeNumber,
  isValidDate,
} from "./primitives";

export const isValidConnectedUser: TypeGuard<ConnectedUser> = (
  value
): value is ConnectedUser => {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;

  return (
    isString(v.id) &&
    (v.id as string).length > 0 &&
    isString(v.name) &&
    (v.name as string).length > 0 &&
    typeof v.isHost === "boolean" &&
    isValidDate(v.connectedAt) &&
    isValidDate(v.lastSeen) &&
    (v.socketId === undefined || isString(v.socketId))
  );
};

export function validateConnectedUser(user: unknown): ConnectedUser {
  if (!isValidConnectedUser(user)) {
    throw new ValidationError("Invalid connected user format");
  }
  return user;
}

export const isValidLyricsLine: TypeGuard<LyricsLine> = (
  value
): value is LyricsLine => {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;

  return (
    isNonNegativeNumber(v.timestamp) &&
    isString(v.text) &&
    (v.duration === undefined || isPositiveNumber(v.duration)) &&
    (v.isChorus === undefined || typeof v.isChorus === "boolean") &&
    (v.isVerse === undefined || typeof v.isVerse === "boolean")
  );
};

export const isValidLyricsFile: TypeGuard<LyricsFile> = (
  value
): value is LyricsFile => {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;

  const validFormats = ["lrc", "srt", "txt", "vtt"];

  return (
    isString(v.songId) &&
    (v.songId as string).length > 0 &&
    Array.isArray(v.lines) &&
    (v.lines as unknown[]).every(isValidLyricsLine) &&
    validFormats.includes(v.format as string)
  );
};

export function validateLyricsFile(lyrics: unknown): LyricsFile {
  if (!isValidLyricsFile(lyrics)) {
    throw new ValidationError("Invalid lyrics file format");
  }
  return lyrics;
}

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
  const sanitized = name.trim().replace(/[<>"'&]/g, "");

  if (sanitized.length === 0) {
    throw new ValidationError(
      "User name contains only invalid characters",
      "INVALID_REQUEST",
      "name"
    );
  }

  return sanitized;
}
