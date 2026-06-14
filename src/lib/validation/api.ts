// API request validation: playback commands and search requests
import { PlaybackCommand, SearchRequest, TypeGuard } from "@/types";
import {
  ValidationError,
  isString,
  isPositiveNumber,
  isNonNegativeNumber,
  isValidDate,
} from "./primitives";

export const isValidPlaybackCommand: TypeGuard<PlaybackCommand> = (
  value
): value is PlaybackCommand => {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;

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
    validActions.includes(v.action as string) &&
    isString(v.userId) &&
    (v.userId as string).length > 0 &&
    isValidDate(v.timestamp) &&
    (v.value === undefined || isNonNegativeNumber(v.value))
  );
};

export function validatePlaybackCommand(command: unknown): PlaybackCommand {
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

export const isValidSearchRequest: TypeGuard<SearchRequest> = (
  value
): value is SearchRequest => {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;

  return (
    isString(v.query) &&
    (v.query as string).trim().length > 0 &&
    (v.limit === undefined ||
      (isPositiveNumber(v.limit) && (v.limit as number) <= 1000)) &&
    (v.offset === undefined || isNonNegativeNumber(v.offset))
  );
};

export function validateSearchRequest(request: unknown): SearchRequest {
  if (!isValidSearchRequest(request)) {
    throw new ValidationError("Invalid search request format");
  }

  // Sanitize query and set defaults
  return {
    ...request,
    query: request.query.trim(),
    limit: request.limit ?? 50,
    offset: request.offset ?? 0,
  };
}
