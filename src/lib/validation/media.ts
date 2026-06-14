// Media item and queue item validation
import { MediaItem, QueueItem, TypeGuard } from "@/types";
import {
  ValidationError,
  isString,
  isPositiveNumber,
  isNonNegativeNumber,
  isValidDate,
  isValidUrl,
} from "./primitives";

export const isValidMediaItem: TypeGuard<MediaItem> = (
  value
): value is MediaItem => {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;

  return (
    isString(v.id) &&
    (v.id as string).length > 0 &&
    isString(v.title) &&
    (v.title as string).length > 0 &&
    isString(v.artist) &&
    (v.artist as string).length > 0 &&
    isPositiveNumber(v.duration) &&
    isString(v.jellyfinId) &&
    (v.jellyfinId as string).length > 0 &&
    isValidUrl(v.streamUrl) &&
    (v.album === undefined || isString(v.album)) &&
    (v.lyricsPath === undefined || isString(v.lyricsPath))
  );
};

export function validateMediaItem(item: unknown): MediaItem {
  if (!isValidMediaItem(item)) {
    throw new ValidationError("Invalid media item format");
  }
  return item;
}

export const isValidQueueItem: TypeGuard<QueueItem> = (
  value
): value is QueueItem => {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;

  const validStatuses = ["pending", "playing", "completed", "skipped"];

  return (
    isString(v.id) &&
    (v.id as string).length > 0 &&
    isValidMediaItem(v.mediaItem) &&
    isString(v.addedBy) &&
    (v.addedBy as string).length > 0 &&
    isValidDate(v.addedAt) &&
    isNonNegativeNumber(v.position) &&
    validStatuses.includes(v.status as string)
  );
};

export function validateQueueItem(item: unknown): QueueItem {
  if (!isValidQueueItem(item)) {
    throw new ValidationError("Invalid queue item format");
  }
  return item;
}
