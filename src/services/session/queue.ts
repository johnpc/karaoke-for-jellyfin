// Queue manipulation operations
import {
  KaraokeSession,
  QueueItem,
  MediaItem,
  QueueOperationResult,
} from "@/types";
import { addToQueue, removeFromQueue, moveQueueItem } from "@/lib/utils";
import { SessionEventEmitter } from "./event-emitter";

export function addSongToQueue(
  session: KaraokeSession,
  mediaItem: MediaItem,
  userId: string,
  emitter: SessionEventEmitter,
  position?: number
): QueueOperationResult {
  const user = session.connectedUsers.find(u => u.id === userId);
  if (!user) {
    return { success: false, message: "User not found in session" };
  }

  // Check user's song limit
  const userSongs = session.queue.filter(
    item => item.addedBy === userId && item.status === "pending"
  );

  if (userSongs.length >= session.hostControls.maxSongsPerUser) {
    return {
      success: false,
      message: `Maximum ${session.hostControls.maxSongsPerUser} songs per user`,
    };
  }

  session.queue = addToQueue(session.queue, mediaItem, userId, position);
  const addedItem = session.queue[position ?? session.queue.length - 1];

  // Auto-start if first song in empty queue with no current song
  const wasQueueEmpty = session.queue.length === 1;
  const noCurrentSong = !session.currentSong;

  if (wasQueueEmpty && noCurrentSong) {
    console.log(
      "First song added to empty queue via API, auto-starting playback"
    );
    addedItem.status = "playing";
    session.currentSong = addedItem;
    session.playbackState = {
      ...session.playbackState,
      isPlaying: true,
      currentTime: 0,
    };
    emitter.emit("song-started", addedItem);
    emitter.emit("playback-state-changed", session.playbackState);
    console.log("API auto-started song:", addedItem.mediaItem.title);
  }

  emitter.emit("queue-updated", session.queue);

  return {
    success: true,
    message: "Song added to queue",
    queueItem: addedItem,
    newQueue: session.queue,
  };
}

export function removeSongFromQueue(
  session: KaraokeSession,
  queueItemId: string,
  userId: string,
  emitter: SessionEventEmitter
): QueueOperationResult {
  const queueItem = session.queue.find(item => item.id === queueItemId);
  if (!queueItem) {
    return { success: false, message: "Song not found in queue" };
  }

  const user = session.connectedUsers.find(u => u.id === userId);
  const isHost = user?.isHost || false;

  if (!isHost && !session.hostControls.allowUserRemove) {
    return {
      success: false,
      message: "Users are not allowed to remove songs",
    };
  }

  if (queueItem.status === "playing") {
    return {
      success: false,
      message: "Cannot remove currently playing song",
    };
  }

  session.queue = removeFromQueue(session.queue, queueItemId);
  emitter.emit("queue-updated", session.queue);

  return {
    success: true,
    message: "Song removed from queue",
    newQueue: session.queue,
  };
}

export function reorderQueue(
  session: KaraokeSession,
  queueItemId: string,
  newPosition: number,
  userId: string,
  emitter: SessionEventEmitter
): QueueOperationResult {
  const user = session.connectedUsers.find(u => u.id === userId);
  if (!user?.isHost) {
    return { success: false, message: "Only the host can reorder the queue" };
  }

  try {
    session.queue = moveQueueItem(session.queue, queueItemId, newPosition);
    emitter.emit("queue-updated", session.queue);

    return {
      success: true,
      message: "Queue reordered",
      newQueue: session.queue,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to reorder queue",
    };
  }
}
