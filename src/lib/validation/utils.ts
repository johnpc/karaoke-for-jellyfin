// Validation utility functions: ID generation, sanitization, duration, queue ops
import { QueueItem } from "@/types";
import {
  ValidationError,
  isString,
  isNumber,
  isNonNegativeNumber,
} from "./primitives";

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
    .replace(/[<>"'&]/g, ""); // Remove potentially harmful characters
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
