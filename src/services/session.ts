// In-memory session state management for Karaoke For Jellyfin
import {
  KaraokeSession,
  QueueItem,
  ConnectedUser,
  MediaItem,
  PlaybackState,
  QueueOperationResult,
  QueueItemStatus,
} from "@/types";
import {
  createKaraokeSession,
  createConnectedUser,
  addToQueue,
  removeFromQueue,
  moveQueueItem,
  getNextSong,
  markSongAsPlaying,
  markSongAsCompleted,
  addUserToSession,
  removeUserFromSession,
  updateSessionActivity,
} from "@/lib/utils";
import {
  validateQueueItem,
  validateConnectedUser,
  ValidationError,
} from "@/lib/validation";

export class KaraokeSessionManager {
  private session: KaraokeSession | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private skipInProgress: boolean = false;
  private songTransitionInProgress: boolean = false;
  private queueOperationInProgress: boolean = false;

  constructor() {
    this.initializeEventTypes();
  }

  private initializeEventTypes() {
    const eventTypes = [
      "session-created",
      "session-destroyed",
      "user-joined",
      "user-left",
      "queue-updated",
      "song-started",
      "song-ended",
      "playback-state-changed",
    ];

    eventTypes.forEach((type) => {
      this.eventListeners.set(type, []);
    });
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  on(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(callback);
    this.eventListeners.set(event, listeners);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  private emit(event: string, data?: unknown): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  createSession(sessionName: string, hostName: string): KaraokeSession {
    if (this.session) {
      throw new ValidationError("A session is already active");
    }

    const hostUser = createConnectedUser(hostName, true);
    this.session = createKaraokeSession(sessionName, hostUser);

    this.emit("session-created", this.session);
    return this.session;
  }

  getSession(): KaraokeSession | null {
    return this.session;
  }

  destroySession(): void {
    if (this.session) {
      const sessionId = this.session.id;
      this.session = null;
      this.emit("session-destroyed", { sessionId });
    }
  }

  updateSessionActivity(): void {
    if (this.session) {
      this.session = updateSessionActivity(this.session);
    }
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  addUser(userName: string, socketId?: string): ConnectedUser {
    if (!this.session) {
      throw new ValidationError("No active session");
    }

    // Check if session is full
    if (this.session.connectedUsers.length >= this.session.settings.maxUsers) {
      throw new ValidationError("Session is full");
    }

    const user = createConnectedUser(userName, false, socketId);
    this.session = addUserToSession(this.session, user);

    this.emit("user-joined", user);
    return user;
  }

  removeUser(userId: string): void {
    if (!this.session) {
      throw new ValidationError("No active session");
    }

    const user = this.session.connectedUsers.find((u) => u.id === userId);
    if (!user) {
      throw new ValidationError("User not found");
    }

    // Remove user's songs from queue if they're not playing
    this.session.queue = this.session.queue.filter(
      (item) => item.addedBy !== userId || item.status === "playing",
    );

    this.session = removeUserFromSession(this.session, userId);

    this.emit("user-left", { userId, user });
    this.emit("queue-updated", this.session.queue);
  }

  getConnectedUsers(): ConnectedUser[] {
    return this.session?.connectedUsers || [];
  }

  updateUserSocketId(userId: string, socketId: string): void {
    if (!this.session) return;

    const userIndex = this.session.connectedUsers.findIndex(
      (u) => u.id === userId,
    );
    if (userIndex >= 0) {
      this.session.connectedUsers[userIndex].socketId = socketId;
      this.session.connectedUsers[userIndex].lastSeen = new Date();
    }
  }

  // ============================================================================
  // QUEUE MANAGEMENT
  // ============================================================================

  addSongToQueue(
    mediaItem: MediaItem,
    userId: string,
    position?: number,
  ): QueueOperationResult {
    if (!this.session) {
      return { success: false, message: "No active session" };
    }

    // Wait for any ongoing queue operations to complete
    if (this.queueOperationInProgress) {
      return {
        success: false,
        message: "Queue operation in progress, please try again",
      };
    }

    this.queueOperationInProgress = true;

    try {
      const user = this.session.connectedUsers.find((u) => u.id === userId);
      if (!user) {
        return { success: false, message: "User not found in session" };
      }

      // Check user's song limit
      const userSongs = this.session.queue.filter(
        (item) => item.addedBy === userId && item.status === "pending",
      );

      if (userSongs.length >= this.session.hostControls.maxSongsPerUser) {
        return {
          success: false,
          message: `Maximum ${this.session.hostControls.maxSongsPerUser} songs per user`,
        };
      }

      this.session.queue = addToQueue(
        this.session.queue,
        mediaItem,
        userId,
        position,
      );
      const addedItem =
        this.session.queue[position ?? this.session.queue.length - 1];

      this.updateSessionActivity();
      this.emit("queue-updated", this.session.queue);

      return {
        success: true,
        message: "Song added to queue",
        queueItem: addedItem,
        newQueue: this.session.queue,
      };
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
    userId: string,
  ): QueueOperationResult {
    if (!this.session) {
      return { success: false, message: "No active session" };
    }

    // Wait for any ongoing queue operations to complete
    if (this.queueOperationInProgress) {
      return {
        success: false,
        message: "Queue operation in progress, please try again",
      };
    }

    this.queueOperationInProgress = true;

    try {
      const queueItem = this.session.queue.find(
        (item) => item.id === queueItemId,
      );
      if (!queueItem) {
        return { success: false, message: "Song not found in queue" };
      }

      const user = this.session.connectedUsers.find((u) => u.id === userId);
      const isHost = user?.isHost || false;

      // Check permissions
      // if (!isHost && queueItem.addedBy !== userId) {
      //   return { success: false, message: 'You can only remove your own songs' }
      // }

      if (!isHost && !this.session.hostControls.allowUserRemove) {
        return {
          success: false,
          message: "Users are not allowed to remove songs",
        };
      }

      // Don't allow removing currently playing song
      if (queueItem.status === "playing") {
        return {
          success: false,
          message: "Cannot remove currently playing song",
        };
      }

      this.session.queue = removeFromQueue(this.session.queue, queueItemId);

      this.updateSessionActivity();
      this.emit("queue-updated", this.session.queue);

      return {
        success: true,
        message: "Song removed from queue",
        newQueue: this.session.queue,
      };
    } finally {
      this.queueOperationInProgress = false;
    }
  }

  reorderQueue(
    queueItemId: string,
    newPosition: number,
    userId: string,
  ): QueueOperationResult {
    if (!this.session) {
      return { success: false, message: "No active session" };
    }

    const user = this.session.connectedUsers.find((u) => u.id === userId);
    if (!user?.isHost) {
      return { success: false, message: "Only the host can reorder the queue" };
    }

    try {
      this.session.queue = moveQueueItem(
        this.session.queue,
        queueItemId,
        newPosition,
      );

      this.updateSessionActivity();
      this.emit("queue-updated", this.session.queue);

      return {
        success: true,
        message: "Queue reordered",
        newQueue: this.session.queue,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to reorder queue",
      };
    }
  }

  getQueue(): QueueItem[] {
    return this.session?.queue || [];
  }

  getCurrentSong(): QueueItem | null {
    return this.session?.currentSong || null;
  }

  // ============================================================================
  // PLAYBACK MANAGEMENT
  // ============================================================================

  startNextSong(): QueueItem | null {
    console.log("startNextSong called");
    if (!this.session) {
      console.log("No session available");
      return null;
    }

    // Prevent concurrent song transitions
    if (this.songTransitionInProgress) {
      console.log("Song transition already in progress, ignoring request");
      return null;
    }

    this.songTransitionInProgress = true;

    try {
      console.log("Current queue:", this.session.queue);
      const nextSong = getNextSong(this.session.queue);
      console.log("Next song from getNextSong:", nextSong);
      if (!nextSong) {
        console.log("No next song available");
        return null;
      }

      // Mark previous song as completed
      if (this.session.currentSong) {
        console.log(
          "Marking previous song as completed:",
          this.session.currentSong.id,
        );
        this.session.queue = markSongAsCompleted(
          this.session.queue,
          this.session.currentSong.id,
        );
      }

      // Mark the next song as playing
      console.log("Marking song as playing:", nextSong.id);
      this.session.queue = markSongAsPlaying(this.session.queue, nextSong.id);

      // Get the updated song object from the queue
      const updatedSong = this.session.queue.find(
        (item) => item.id === nextSong.id,
      )!;
      console.log("Updated song object:", updatedSong);
      this.session.currentSong = updatedSong;

      // Reset playback state
      this.session.playbackState = {
        ...this.session.playbackState,
        isPlaying: true,
        currentTime: 0,
      };
      console.log("Updated playback state:", this.session.playbackState);

      this.updateSessionActivity();
      this.emit("song-started", updatedSong);
      this.emit("queue-updated", this.session.queue);
      this.emit("playback-state-changed", this.session.playbackState);

      return updatedSong;
    } finally {
      this.songTransitionInProgress = false;
    }
  }

  endCurrentSong(): void {
    if (!this.session || !this.session.currentSong) return;

    // Prevent concurrent song transitions
    if (this.songTransitionInProgress) {
      console.log(
        "Song transition already in progress, ignoring endCurrentSong",
      );
      return;
    }

    this.songTransitionInProgress = true;

    try {
      const completedSong = this.session.currentSong;

      // Mark song as completed
      this.session.queue = markSongAsCompleted(
        this.session.queue,
        completedSong.id,
      );

      // Clear current song
      this.session.currentSong = null;

      // Stop playback
      this.session.playbackState = {
        ...this.session.playbackState,
        isPlaying: false,
        currentTime: 0,
      };

      this.updateSessionActivity();
      this.emit("song-ended", completedSong);
      this.emit("queue-updated", this.session.queue);
      this.emit("playback-state-changed", this.session.playbackState);

      // Auto-advance if enabled
      if (this.session.hostControls.autoAdvance) {
        setTimeout(() => {
          // Double-check that we're not in the middle of another transition
          if (!this.songTransitionInProgress) {
            this.startNextSong();
          }
        }, 1000); // 1 second delay
      }
    } finally {
      this.songTransitionInProgress = false;
    }
  }

  skipCurrentSong(userId: string): QueueOperationResult {
    console.log(`Skip song requested by user ${userId}`);

    if (!this.session) {
      return { success: false, message: "No active session" };
    }

    if (!this.session.currentSong) {
      console.log("Skip failed: No song currently playing");
      return { success: false, message: "No song currently playing" };
    }

    // Prevent concurrent skip operations
    if (this.skipInProgress) {
      console.log("Skip failed: Skip already in progress");
      return { success: false, message: "Skip already in progress" };
    }

    // Prevent skip during song transitions
    if (this.songTransitionInProgress) {
      console.log("Skip failed: Song transition in progress");
      return { success: false, message: "Song transition in progress" };
    }

    const user = this.session.connectedUsers.find((u) => u.id === userId);
    const isHost = user?.isHost || false;
    const isOwner = this.session.currentSong.addedBy === userId;

    if (!isHost && !isOwner && !this.session.hostControls.allowUserSkip) {
      console.log("Skip failed: User not allowed to skip songs");
      return { success: false, message: "You are not allowed to skip songs" };
    }

    console.log(`Processing skip for song: ${this.session.currentSong.id}`);
    this.skipInProgress = true;
    this.songTransitionInProgress = true;

    try {
      // Double-check that we still have a current song after acquiring the lock
      if (!this.session.currentSong) {
        console.log(
          "Skip failed: Current song disappeared after acquiring lock",
        );
        return { success: false, message: "No song currently playing" };
      }

      const currentSongId = this.session.currentSong.id;
      console.log(`Marking song ${currentSongId} as skipped`);

      // Mark as skipped instead of completed
      this.session.queue = this.session.queue.map((item) => ({
        ...item,
        status:
          item.id === currentSongId
            ? ("skipped" as QueueItemStatus)
            : item.status,
      }));

      const skippedSong = this.session.currentSong;
      this.session.currentSong = null;

      this.session.playbackState = {
        ...this.session.playbackState,
        isPlaying: false,
        currentTime: 0,
      };

      console.log(
        `Song ${currentSongId} successfully skipped, emitting events`,
      );
      this.updateSessionActivity();
      this.emit("song-ended", skippedSong);
      this.emit("queue-updated", this.session.queue);
      this.emit("playback-state-changed", this.session.playbackState);

      // Auto-advance to next song with a shorter delay than endCurrentSong
      setTimeout(() => {
        console.log("Skip auto-advance timeout triggered");
        // Double-check that we're not in the middle of another transition
        if (!this.songTransitionInProgress) {
          console.log("Starting next song after skip");
          this.startNextSong();
        } else {
          console.log("Skip auto-advance cancelled: transition in progress");
        }
      }, 300); // Shorter delay for skip

      return { success: true, message: "Song skipped" };
    } finally {
      this.skipInProgress = false;
      this.songTransitionInProgress = false;
      console.log("Skip operation completed, locks released");
    }
  }

  updatePlaybackState(updates: Partial<PlaybackState>): void {
    if (!this.session) return;

    this.session.playbackState = {
      ...this.session.playbackState,
      ...updates,
    };

    this.updateSessionActivity();
    this.emit("playback-state-changed", this.session.playbackState);
  }

  getPlaybackState(): PlaybackState | null {
    return this.session?.playbackState || null;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getSessionStats() {
    if (!this.session) return null;

    const totalSongs = this.session.queue.length;
    const completedSongs = this.session.queue.filter(
      (item) => item.status === "completed",
    ).length;
    const pendingSongs = this.session.queue.filter(
      (item) => item.status === "pending",
    ).length;

    return {
      sessionId: this.session.id,
      sessionName: this.session.name,
      connectedUsers: this.session.connectedUsers.length,
      totalSongs,
      completedSongs,
      pendingSongs,
      currentSong: this.session.currentSong,
      isPlaying: this.session.playbackState.isPlaying,
      createdAt: this.session.createdAt,
      lastActivity: this.session.lastActivity,
    };
  }

  cleanup(): void {
    // Clean up completed songs older than 1 hour
    if (!this.session) return;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const initialLength = this.session.queue.length;

    this.session.queue = this.session.queue.filter((item) => {
      if (item.status === "completed" || item.status === "skipped") {
        return item.addedAt > oneHourAgo;
      }
      return true;
    });

    // Update positions
    this.session.queue = this.session.queue.map((item, index) => ({
      ...item,
      position: index,
    }));

    if (this.session.queue.length !== initialLength) {
      this.emit("queue-updated", this.session.queue);
    }
  }
}

// Singleton instance
let sessionManager: KaraokeSessionManager | null = null;

export function getSessionManager(): KaraokeSessionManager {
  if (!sessionManager) {
    sessionManager = new KaraokeSessionManager();
  }
  return sessionManager;
}
