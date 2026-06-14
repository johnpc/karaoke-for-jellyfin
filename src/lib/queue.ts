// Queue manipulation utilities
import { MediaItem, QueueItem, QueueItemStatus } from "@/types";
import { generateId } from "./validation";

export function createQueueItem(
  mediaItem: MediaItem,
  addedBy: string,
  position?: number
): QueueItem {
  return {
    id: `queue_${generateId()}`,
    mediaItem,
    addedBy: addedBy.trim(),
    addedAt: new Date(),
    position: position ?? 0,
    status: "pending" as QueueItemStatus,
  };
}

export function addToQueue(
  queue: QueueItem[],
  mediaItem: MediaItem,
  addedBy: string,
  position?: number
): QueueItem[] {
  const newQueue = [...queue];
  const insertPosition = position ?? newQueue.length;

  const queueItem = createQueueItem(mediaItem, addedBy, insertPosition);

  // Insert at specified position
  newQueue.splice(insertPosition, 0, queueItem);

  // Update positions for all items
  return newQueue.map((item, index) => ({
    ...item,
    position: index,
  }));
}

export function removeFromQueue(
  queue: QueueItem[],
  itemId: string
): QueueItem[] {
  const newQueue = queue.filter(item => item.id !== itemId);

  // Update positions
  return newQueue.map((item, index) => ({
    ...item,
    position: index,
  }));
}

export function moveQueueItem(
  queue: QueueItem[],
  itemId: string,
  newPosition: number
): QueueItem[] {
  const currentIndex = queue.findIndex(item => item.id === itemId);
  if (currentIndex === -1) return queue;

  const newQueue = [...queue];
  const [movedItem] = newQueue.splice(currentIndex, 1);
  newQueue.splice(newPosition, 0, movedItem);

  // Update positions
  return newQueue.map((item, index) => ({
    ...item,
    position: index,
  }));
}

export function getNextSong(queue: QueueItem[]): QueueItem | null {
  const pendingSongs = queue.filter(item => item.status === "pending");
  return pendingSongs.length > 0 ? pendingSongs[0] : null;
}

export function markSongAsPlaying(
  queue: QueueItem[],
  songId: string
): QueueItem[] {
  return queue.map(item => ({
    ...item,
    status: item.id === songId ? ("playing" as QueueItemStatus) : item.status,
  }));
}

export function markSongAsCompleted(
  queue: QueueItem[],
  songId: string
): QueueItem[] {
  return queue.map(item => ({
    ...item,
    status: item.id === songId ? ("completed" as QueueItemStatus) : item.status,
  }));
}

export function getUserQueueItems(
  queue: QueueItem[],
  userId: string
): QueueItem[] {
  return queue.filter(item => item.addedBy === userId);
}
