// Full session manager — extends core with queue, playback, and utility methods
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
import {
  startNextSong as doStartNextSong,
  endCurrentSong as doEndCurrentSong,
  skipCurrentSong as doSkipCurrentSong,
  updatePlaybackState as doUpdatePlaybackState,
} from "./playback";

export class KaraokeSessionManager extends SessionCore {
  // QUEUE

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

  // PLAYBACK

  startNextSong(): QueueItem | null {
    if (!this.session || this.songTransitionInProgress) return null;
    this.songTransitionInProgress = true;
    try {
      const result = doStartNextSong(this.session, this);
      if (result) this.updateSessionActivity();
      return result;
    } finally {
      this.songTransitionInProgress = false;
    }
  }

  endCurrentSong(): void {
    if (!this.session?.currentSong || this.songTransitionInProgress) return;
    this.songTransitionInProgress = true;
    try {
      doEndCurrentSong(this.session, this, () => {
        if (!this.songTransitionInProgress) this.startNextSong();
      });
      this.updateSessionActivity();
    } finally {
      this.songTransitionInProgress = false;
    }
  }

  skipCurrentSong(userId: string): QueueOperationResult {
    if (!this.session) return { success: false, message: "No active session" };
    if (!this.session.currentSong)
      return { success: false, message: "No song currently playing" };
    if (this.skipInProgress)
      return { success: false, message: "Skip already in progress" };
    if (this.songTransitionInProgress) {
      return { success: false, message: "Song transition in progress" };
    }
    this.skipInProgress = true;
    this.songTransitionInProgress = true;
    try {
      if (!this.session.currentSong)
        return { success: false, message: "No song currently playing" };
      const result = doSkipCurrentSong(this.session, userId, this, () => {
        if (!this.songTransitionInProgress) this.startNextSong();
      });
      if (result.success) this.updateSessionActivity();
      return result;
    } finally {
      this.skipInProgress = false;
      this.songTransitionInProgress = false;
    }
  }

  updatePlaybackState(updates: Partial<PlaybackState>): void {
    if (!this.session) return;
    doUpdatePlaybackState(this.session, updates, this);
    this.updateSessionActivity();
  }

  getPlaybackState(): PlaybackState | null {
    return this.session?.playbackState || null;
  }

  // UTILITY

  getSessionStats(): SessionStats | null {
    if (!this.session) return null;
    return getSessionStats(this.session);
  }

  cleanup(): void {
    if (!this.session) return;
    cleanupQueue(this.session, this);
  }
}
