// Unit tests for session management
import { describe, it, expect, beforeEach } from "vitest";
import { KaraokeSessionManager } from "@/services/session";
import { MediaItem, QueueItem, ConnectedUser } from "@/types";

describe("KaraokeSessionManager", () => {
  let sessionManager: KaraokeSessionManager;
  let mockMediaItem: MediaItem;

  beforeEach(() => {
    sessionManager = new KaraokeSessionManager();
    mockMediaItem = {
      id: "media_123",
      title: "Test Song",
      artist: "Test Artist",
      album: "Test Album",
      duration: 180,
      jellyfinId: "jellyfin_123",
      streamUrl: "http://test.com/stream/123",
      lyricsPath: undefined,
    };
  });

  describe("Session Management", () => {
    it("should create a new session", () => {
      const session = sessionManager.createSession("Test Session", "Host User");

      expect(session).toBeDefined();
      expect(session.name).toBe("Test Session");
      expect(session.connectedUsers).toHaveLength(1);
      expect(session.connectedUsers[0].name).toBe("Host User");
      expect(session.connectedUsers[0].isHost).toBe(true);
      expect(session.queue).toHaveLength(0);
    });

    it("should not allow creating multiple sessions", () => {
      sessionManager.createSession("First Session", "Host");

      expect(() => {
        sessionManager.createSession("Second Session", "Host");
      }).toThrow("A session is already active");
    });

    it("should get the current session", () => {
      const created = sessionManager.createSession("Test Session", "Host");
      const retrieved = sessionManager.getSession();

      expect(retrieved).toEqual(created);
    });

    it("should destroy a session", () => {
      sessionManager.createSession("Test Session", "Host");
      sessionManager.destroySession();

      expect(sessionManager.getSession()).toBeNull();
    });
  });

  describe("User Management", () => {
    beforeEach(() => {
      sessionManager.createSession("Test Session", "Host");
    });

    it("should add a user to the session", () => {
      const user = sessionManager.addUser("Test User", "socket123");

      expect(user.name).toBe("Test User");
      expect(user.isHost).toBe(false);
      expect(user.socketId).toBe("socket123");

      const users = sessionManager.getConnectedUsers();
      expect(users).toHaveLength(2); // Host + new user
    });

    it("should not allow adding users when session is full", () => {
      const session = sessionManager.getSession()!;
      session.settings.maxUsers = 1; // Only allow host

      expect(() => {
        sessionManager.addUser("Test User");
      }).toThrow("Session is full");
    });

    it("should remove a user from the session", () => {
      const user = sessionManager.addUser("Test User");
      sessionManager.removeUser(user.id);

      const users = sessionManager.getConnectedUsers();
      expect(users).toHaveLength(1); // Only host remains
    });

    it("should update user socket ID", () => {
      const user = sessionManager.addUser("Test User");
      sessionManager.updateUserSocketId(user.id, "new_socket_123");

      const users = sessionManager.getConnectedUsers();
      const updatedUser = users.find(u => u.id === user.id);
      expect(updatedUser?.socketId).toBe("new_socket_123");
    });
  });

  describe("Queue Management", () => {
    let hostUser: ConnectedUser;
    let regularUser: ConnectedUser;

    beforeEach(() => {
      const session = sessionManager.createSession("Test Session", "Host");
      hostUser = session.connectedUsers[0];
      regularUser = sessionManager.addUser("Regular User");
    });

    it("should add a song to the queue", () => {
      const result = sessionManager.addSongToQueue(
        mockMediaItem,
        regularUser.id
      );

      expect(result.success).toBe(true);
      expect(result.queueItem).toBeDefined();
      expect(result.queueItem?.mediaItem.title).toBe("Test Song");
      expect(result.queueItem?.addedBy).toBe(regularUser.id);

      const queue = sessionManager.getQueue();
      expect(queue).toHaveLength(1);
    });

    it("should enforce user song limits", () => {
      const session = sessionManager.getSession()!;
      session.hostControls.maxSongsPerUser = 2;

      // First song auto-starts (status = "playing", not "pending") — doesn't count toward limit
      const result1 = sessionManager.addSongToQueue(
        mockMediaItem,
        regularUser.id
      );
      expect(result1.success).toBe(true);

      // Second song stays "pending" — 1 pending
      const result2 = sessionManager.addSongToQueue(
        { ...mockMediaItem, id: "media_456" },
        regularUser.id
      );
      expect(result2.success).toBe(true);

      // Third song stays "pending" — 2 pending = at limit
      const result3 = sessionManager.addSongToQueue(
        { ...mockMediaItem, id: "media_789" },
        regularUser.id
      );
      expect(result3.success).toBe(true);

      // Fourth song would exceed limit — should fail
      const result4 = sessionManager.addSongToQueue(
        { ...mockMediaItem, id: "media_101" },
        regularUser.id
      );
      expect(result4.success).toBe(false);
      expect(result4.message).toContain("Maximum 2 songs per user");
    });

    it("should remove a pending song from the queue", () => {
      // First song auto-starts, add a second that stays pending
      sessionManager.addSongToQueue(mockMediaItem, regularUser.id);
      const addResult = sessionManager.addSongToQueue(
        { ...mockMediaItem, id: "media_456", title: "Second Song" },
        regularUser.id
      );
      const queueItem = addResult.queueItem!;

      const removeResult = sessionManager.removeSongFromQueue(
        queueItem.id,
        regularUser.id
      );

      expect(removeResult.success).toBe(true);
      // Only the first (playing) song remains
      expect(sessionManager.getQueue()).toHaveLength(1);
    });

    it("should not allow removing currently playing song", () => {
      // First song auto-starts (status = "playing")
      const addResult = sessionManager.addSongToQueue(
        mockMediaItem,
        regularUser.id
      );
      const queueItem = addResult.queueItem!;

      const removeResult = sessionManager.removeSongFromQueue(
        queueItem.id,
        regularUser.id
      );

      expect(removeResult.success).toBe(false);
      expect(removeResult.message).toBe("Cannot remove currently playing song");
    });

    it("should allow host to reorder queue", () => {
      sessionManager.addSongToQueue(mockMediaItem, regularUser.id);
      sessionManager.addSongToQueue(
        { ...mockMediaItem, id: "media_456", title: "Second Song" },
        regularUser.id
      );

      const queue = sessionManager.getQueue();
      const firstItem = queue[0];

      const result = sessionManager.reorderQueue(firstItem.id, 1, hostUser.id);

      expect(result.success).toBe(true);

      const newQueue = sessionManager.getQueue();
      expect(newQueue[1].id).toBe(firstItem.id);
    });

    it("should not allow non-host to reorder queue", () => {
      sessionManager.addSongToQueue(mockMediaItem, regularUser.id);

      const queue = sessionManager.getQueue();
      const firstItem = queue[0];

      const result = sessionManager.reorderQueue(
        firstItem.id,
        0,
        regularUser.id
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("Only the host can reorder the queue");
    });
  });

  describe("Playback Management", () => {
    let hostUser: ConnectedUser;
    let regularUser: ConnectedUser;

    beforeEach(() => {
      const session = sessionManager.createSession("Test Session", "Host");
      hostUser = session.connectedUsers[0];
      regularUser = sessionManager.addUser("Regular User");
      // First song auto-starts when added to empty queue
      sessionManager.addSongToQueue(mockMediaItem, regularUser.id);
    });

    it("should auto-start the first song added to empty queue", () => {
      const currentSong = sessionManager.getCurrentSong();
      expect(currentSong).toBeDefined();
      expect(currentSong?.mediaItem.title).toBe("Test Song");
      expect(currentSong?.status).toBe("playing");

      const playbackState = sessionManager.getPlaybackState();
      expect(playbackState?.isPlaying).toBe(true);
    });

    it("should start the next song after current ends", () => {
      // Add a second song
      sessionManager.addSongToQueue(
        { ...mockMediaItem, id: "media_456", title: "Second Song" },
        regularUser.id
      );

      // End the current song — removes it from queue
      sessionManager.endCurrentSong();

      expect(sessionManager.getCurrentSong()).toBeNull();

      const playbackState = sessionManager.getPlaybackState();
      expect(playbackState?.isPlaying).toBe(false);

      // Queue should only have the second (pending) song
      const queue = sessionManager.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].mediaItem.title).toBe("Second Song");
    });

    it("should end the current song and remove it from queue", () => {
      sessionManager.endCurrentSong();

      expect(sessionManager.getCurrentSong()).toBeNull();

      const playbackState = sessionManager.getPlaybackState();
      expect(playbackState?.isPlaying).toBe(false);

      // Completed songs are immediately removed
      const queue = sessionManager.getQueue();
      expect(queue).toHaveLength(0);
    });

    it("should skip the current song and remove it from queue", () => {
      const result = sessionManager.skipCurrentSong(hostUser.id);

      expect(result.success).toBe(true);
      expect(sessionManager.getCurrentSong()).toBeNull();

      // Skipped songs are immediately removed
      const queue = sessionManager.getQueue();
      expect(queue).toHaveLength(0);
    });

    it("should not allow non-host to skip without permission", () => {
      const session = sessionManager.getSession()!;
      session.hostControls.allowUserSkip = false;

      // Add another user who didn't add the song
      const anotherUser = sessionManager.addUser("Another User");

      sessionManager.startNextSong();
      const result = sessionManager.skipCurrentSong(anotherUser.id);

      expect(result.success).toBe(false);
      expect(result.message).toBe("You are not allowed to skip songs");
    });

    it("should allow song owner to skip their own song", () => {
      const session = sessionManager.getSession()!;
      session.hostControls.allowUserSkip = false;

      sessionManager.startNextSong();
      const result = sessionManager.skipCurrentSong(regularUser.id); // regularUser added the song

      expect(result.success).toBe(true);
    });

    it("should update playback state", () => {
      sessionManager.updatePlaybackState({ volume: 75, currentTime: 30 });

      const state = sessionManager.getPlaybackState();
      expect(state?.volume).toBe(75);
      expect(state?.currentTime).toBe(30);
    });

    it("should return error when skipping with no active session", () => {
      const freshManager = new KaraokeSessionManager();
      const result = freshManager.skipCurrentSong("some-user-id");

      expect(result.success).toBe(false);
      expect(result.message).toBe("No active session");
    });

    it("should return error when no song is currently playing", () => {
      // End the current song so nothing is playing
      sessionManager.endCurrentSong();

      const result = sessionManager.skipCurrentSong(regularUser.id);

      expect(result.success).toBe(false);
      expect(result.message).toBe("No song currently playing");
    });

    it("should prevent concurrent skips", () => {
      sessionManager.startNextSong();

      // Simulate skip already in progress
      (
        sessionManager as unknown as { skipInProgress: boolean }
      ).skipInProgress = true;

      const result = sessionManager.skipCurrentSong(regularUser.id);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Skip already in progress");

      // Reset to avoid affecting other tests
      (
        sessionManager as unknown as { skipInProgress: boolean }
      ).skipInProgress = false;
    });

    it("should prevent skip during song transition", () => {
      sessionManager.startNextSong();

      // Simulate song transition in progress
      (
        sessionManager as unknown as { songTransitionInProgress: boolean }
      ).songTransitionInProgress = true;

      const result = sessionManager.skipCurrentSong(regularUser.id);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Song transition in progress");

      // Reset to avoid affecting other tests
      (
        sessionManager as unknown as { songTransitionInProgress: boolean }
      ).songTransitionInProgress = false;
    });
  });

  describe("Event System", () => {
    it("should emit events when session is created", done => {
      sessionManager.on("session-created", session => {
        expect(session.name).toBe("Test Session");
        done();
      });

      sessionManager.createSession("Test Session", "Host");
    });

    it("should emit events when user joins", done => {
      sessionManager.createSession("Test Session", "Host");

      sessionManager.on("user-joined", user => {
        expect(user.name).toBe("Test User");
        done();
      });

      sessionManager.addUser("Test User");
    });

    it("should emit events when queue is updated", done => {
      sessionManager.createSession("Test Session", "Host");
      const user = sessionManager.addUser("Test User");

      sessionManager.on("queue-updated", queue => {
        expect(queue).toHaveLength(1);
        done();
      });

      sessionManager.addSongToQueue(mockMediaItem, user.id);
    });
  });

  describe("Utility Methods", () => {
    beforeEach(() => {
      sessionManager.createSession("Test Session", "Host");
    });

    it("should provide session stats", () => {
      const user = sessionManager.addUser("Test User");
      // First song auto-starts (status = "playing")
      sessionManager.addSongToQueue(mockMediaItem, user.id);
      // Second song stays pending
      sessionManager.addSongToQueue(
        { ...mockMediaItem, id: "media_456" },
        user.id
      );

      const stats = sessionManager.getSessionStats();

      expect(stats).toBeDefined();
      expect(stats?.sessionName).toBe("Test Session");
      expect(stats?.connectedUsers).toBe(2);
      expect(stats?.totalSongs).toBe(2);
      expect(stats?.pendingSongs).toBe(1);
      expect(stats?.playingSongs).toBe(1);
    });

    it("should cleanup queue positions", () => {
      const user = sessionManager.addUser("Test User");
      sessionManager.addSongToQueue(mockMediaItem, user.id);
      sessionManager.addSongToQueue(
        { ...mockMediaItem, id: "media_456" },
        user.id
      );

      sessionManager.cleanup();

      const queue = sessionManager.getQueue();
      queue.forEach((item, index) => {
        expect(item.position).toBe(index);
      });
    });
  });
});
