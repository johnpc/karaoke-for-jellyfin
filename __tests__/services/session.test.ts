// Unit tests for session management
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
      session.hostControls.maxSongsPerUser = 1;

      // Add first song - should succeed
      const result1 = sessionManager.addSongToQueue(
        mockMediaItem,
        regularUser.id
      );
      expect(result1.success).toBe(true);

      // Add second song - should fail
      const result2 = sessionManager.addSongToQueue(
        mockMediaItem,
        regularUser.id
      );
      expect(result2.success).toBe(false);
      expect(result2.message).toContain("Maximum 1 songs per user");
    });

    it("should remove a song from the queue", () => {
      const addResult = sessionManager.addSongToQueue(
        mockMediaItem,
        regularUser.id
      );
      const queueItem = addResult.queueItem!;

      const removeResult = sessionManager.removeSongFromQueue(
        queueItem.id,
        regularUser.id
      );

      expect(removeResult.success).toBe(true);
      expect(sessionManager.getQueue()).toHaveLength(0);
    });

    it("should not allow removing other users songs", () => {
      const addResult = sessionManager.addSongToQueue(
        mockMediaItem,
        regularUser.id
      );
      const queueItem = addResult.queueItem!;

      const anotherUser = sessionManager.addUser("Another User");
      const removeResult = sessionManager.removeSongFromQueue(
        queueItem.id,
        anotherUser.id
      );

      expect(removeResult.success).toBe(false);
      expect(removeResult.message).toBe("You can only remove your own songs");
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
      sessionManager.addSongToQueue(mockMediaItem, regularUser.id);
    });

    it("should start the next song", () => {
      const song = sessionManager.startNextSong();

      expect(song).toBeDefined();
      expect(song?.mediaItem.title).toBe("Test Song");
      expect(song?.status).toBe("playing");

      const currentSong = sessionManager.getCurrentSong();
      expect(currentSong?.id).toBe(song?.id);

      const playbackState = sessionManager.getPlaybackState();
      expect(playbackState?.isPlaying).toBe(true);
      expect(playbackState?.currentTime).toBe(0);
    });

    it("should end the current song", () => {
      sessionManager.startNextSong();
      sessionManager.endCurrentSong();

      expect(sessionManager.getCurrentSong()).toBeNull();

      const playbackState = sessionManager.getPlaybackState();
      expect(playbackState?.isPlaying).toBe(false);

      const queue = sessionManager.getQueue();
      expect(queue[0].status).toBe("completed");
    });

    it("should skip the current song", () => {
      sessionManager.startNextSong();
      const result = sessionManager.skipCurrentSong(hostUser.id);

      expect(result.success).toBe(true);
      expect(sessionManager.getCurrentSong()).toBeNull();

      const queue = sessionManager.getQueue();
      expect(queue[0].status).toBe("skipped");
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
      sessionManager.addSongToQueue(mockMediaItem, user.id);

      const stats = sessionManager.getSessionStats();

      expect(stats).toBeDefined();
      expect(stats?.sessionName).toBe("Test Session");
      expect(stats?.connectedUsers).toBe(2);
      expect(stats?.totalSongs).toBe(1);
      expect(stats?.pendingSongs).toBe(1);
      expect(stats?.completedSongs).toBe(0);
    });

    it("should clean up old completed songs", () => {
      const user = sessionManager.addUser("Test User");
      sessionManager.addSongToQueue(mockMediaItem, user.id);

      // Start and end the song to mark it as completed
      sessionManager.startNextSong();
      sessionManager.endCurrentSong();

      // Manually set the addedAt time to be old
      const queue = sessionManager.getQueue();
      queue[0].addedAt = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

      sessionManager.cleanup();

      // Song should be removed
      expect(sessionManager.getQueue()).toHaveLength(0);
    });
  });
});
