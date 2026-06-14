import {
  QueueItem,
  MediaItem,
  PlaybackState,
  QueueOperationResult,
} from "@/types";
import { SessionCore } from "./session-core";
import { SessionStats } from "./types";
import { getSessionStats, cleanupQueue } from "./stats";
import { addSongToQueue, removeSongFromQueue, reorderQueue } from "./queue";
import * as pb from "./playback-operations";

export class KaraokeSessionManager extends SessionCore {
  addSongToQueue(
    mediaItem: MediaItem,
    userId: string,
    position?: number
  ): QueueOperationResult {
    if (!this.session) return { success: false, message: "No active session" };
    if (this.queueOperationInProgress) {
      return {
        success: false,
        message: "Queue operation in progress, please try again",
      };
    }
    this.queueOperationInProgress = true;
    try {
      const result = addSongToQueue(
        this.session,
        mediaItem,
        userId,
        this,
        position
      );
      if (result.success) this.updateSessionActivity();
      return result;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to add song",
      };
    } finally {
      this.queueOperationInProgress = false;
    }
  }

  removeSongFromQueue(
    queueItemId: string,
    userId: string
  ): QueueOperationResult {
    if (!this.session) return { success: false, message: "No active session" };
    if (this.queueOperationInProgress) {
      return {
        success: false,
        message: "Queue operation in progress, please try again",
      };
    }
    this.queueOperationInProgress = true;
    try {
      const result = removeSongFromQueue(
        this.session,
        queueItemId,
        userId,
        this
      );
      if (result.success) this.updateSessionActivity();
      return result;
    } finally {
      this.queueOperationInProgress = false;
    }
  }

  reorderQueue(
    queueItemId: string,
    newPosition: number,
    userId: string
  ): QueueOperationResult {
    if (!this.session) return { success: false, message: "No active session" };
    const result = reorderQueue(
      this.session,
      queueItemId,
      newPosition,
      userId,
      this
    );
    if (result.success) this.updateSessionActivity();
    return result;
  }

  getQueue(): QueueItem[] {
    return this.session?.queue || [];
  }
  getCurrentSong(): QueueItem | null {
    return this.session?.currentSong || null;
  }
  startNextSong(): QueueItem | null {
    return pb.startNextSong(this);
  }
  endCurrentSong(): void {
    pb.endCurrentSong(this);
  }
  skipCurrentSong(userId: string): QueueOperationResult {
    return pb.skipCurrentSong(this, userId);
  }
  updatePlaybackState(updates: Partial<PlaybackState>): void {
    pb.updatePlaybackState(this, updates);
  }
  getPlaybackState(): PlaybackState | null {
    return pb.getPlaybackState(this);
  }

  getSessionStats(): SessionStats | null {
    if (!this.session) return null;
    return getSessionStats(this.session);
  }

  cleanup(): void {
    if (!this.session) return;
    cleanupQueue(this.session, this);
  }
}
