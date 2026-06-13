import { describe, it, expect, vi, beforeEach } from "vitest";
import { Server as HTTPServer } from "http";

// Mock socket.io
const mockEmit = vi.fn();
const mockTo = vi.fn().mockReturnValue({ emit: mockEmit });
const mockOn = vi.fn();
const mockSocketEmit = vi.fn();
const mockSocketJoin = vi.fn();
const mockSocketOn = vi.fn();

const mockSocket = {
  id: "socket_123",
  emit: mockSocketEmit,
  join: mockSocketJoin,
  on: mockSocketOn,
};

const mockIo = {
  emit: mockEmit,
  to: mockTo,
  on: mockOn,
};

// Use a function constructor mock
vi.mock("socket.io", () => {
  return {
    Server: vi.fn(function () {
      return mockIo;
    }),
  };
});

// Mock session manager
const mockSessionManager = {
  getSession: vi.fn(),
  createSession: vi.fn(),
  addUser: vi.fn(),
  updateUserSocketId: vi.fn(),
  getQueue: vi.fn().mockReturnValue([]),
  getCurrentSong: vi.fn().mockReturnValue(null),
  getPlaybackState: vi.fn().mockReturnValue({ isPlaying: false }),
  addSongToQueue: vi.fn(),
  removeSongFromQueue: vi.fn(),
  reorderQueue: vi.fn(),
  updatePlaybackState: vi.fn(),
  startNextSong: vi.fn(),
  skipCurrentSong: vi.fn(),
  removeUser: vi.fn(),
  on: vi.fn(),
};

vi.mock("@/services/session", () => ({
  getSessionManager: () => mockSessionManager,
}));

// Mock lyrics service
const mockUpdateSyncState = vi.fn();
const mockLyricsService = {
  updateSyncState: mockUpdateSyncState,
};

vi.mock("@/services/lyrics", () => ({
  getLyricsService: () => mockLyricsService,
}));

import {
  initializeWebSocket,
  getWebSocketServer,
  broadcastToSession,
  broadcastToAll,
} from "@/lib/websocket";

// Since initializeWebSocket only creates the server once (module-level io),
// we call it once and capture the connection handler for use in all tests.
let connectionHandler: (socket: typeof mockSocket) => void;

describe("websocket", () => {
  beforeEach(() => {
    // Clear mock call history but NOT implementations
    mockEmit.mockClear();
    mockTo.mockClear().mockReturnValue({ emit: mockEmit });
    mockSocketEmit.mockClear();
    mockSocketJoin.mockClear();
    mockSocketOn.mockClear();
    mockSessionManager.getSession.mockReset();
    mockSessionManager.createSession.mockReset();
    mockSessionManager.addUser.mockReset();
    mockSessionManager.updateUserSocketId.mockClear();
    mockSessionManager.getQueue.mockReturnValue([]);
    mockSessionManager.getCurrentSong.mockReturnValue(null);
    mockSessionManager.getPlaybackState.mockReturnValue({ isPlaying: false });
    mockSessionManager.addSongToQueue.mockReset();
    mockSessionManager.removeSongFromQueue.mockReset();
    mockSessionManager.reorderQueue.mockReset();
    mockSessionManager.updatePlaybackState.mockClear();
    mockSessionManager.startNextSong.mockClear();
    mockSessionManager.skipCurrentSong.mockReset();
    mockSessionManager.removeUser.mockReset();
    mockUpdateSyncState.mockClear();
  });

  describe("initializeWebSocket", () => {
    it("creates a new socket.io server and returns it", () => {
      const mockServer = {} as HTTPServer;
      const result = initializeWebSocket(mockServer);

      expect(result).toBe(mockIo);

      // Capture the connection handler for other tests
      const connCall = mockOn.mock.calls.find(
        (call: [string, (...args: unknown[]) => void]) =>
          call[0] === "connection"
      );
      connectionHandler = connCall?.[1];
    });

    it("sets up connection handler", () => {
      expect(mockOn).toHaveBeenCalledWith("connection", expect.any(Function));
    });

    it("registers session event listeners", () => {
      expect(mockSessionManager.on).toHaveBeenCalledWith(
        "session-created",
        expect.any(Function)
      );
      expect(mockSessionManager.on).toHaveBeenCalledWith(
        "user-joined",
        expect.any(Function)
      );
      expect(mockSessionManager.on).toHaveBeenCalledWith(
        "user-left",
        expect.any(Function)
      );
      expect(mockSessionManager.on).toHaveBeenCalledWith(
        "queue-updated",
        expect.any(Function)
      );
      expect(mockSessionManager.on).toHaveBeenCalledWith(
        "song-started",
        expect.any(Function)
      );
      expect(mockSessionManager.on).toHaveBeenCalledWith(
        "song-ended",
        expect.any(Function)
      );
      expect(mockSessionManager.on).toHaveBeenCalledWith(
        "playback-state-changed",
        expect.any(Function)
      );
    });

    it("does not recreate server on subsequent calls", () => {
      const mockServer = {} as HTTPServer;

      // mockOn should not receive a new "connection" listener
      // since io already exists from the first initializeWebSocket call
      mockOn.mockClear();
      initializeWebSocket(mockServer);

      expect(mockOn).not.toHaveBeenCalled();
    });
  });

  describe("session event broadcasting", () => {
    it("broadcasts session-created to all clients", () => {
      const sessionCreatedHandler = mockSessionManager.on.mock.calls.find(
        (call: [string, (...args: unknown[]) => void]) =>
          call[0] === "session-created"
      )?.[1];

      mockEmit.mockClear();
      const sessionData = { id: "session_1", name: "Test" };
      sessionCreatedHandler(sessionData);

      expect(mockEmit).toHaveBeenCalledWith("session-updated", sessionData);
    });

    it("broadcasts user-joined to all clients", () => {
      const userJoinedHandler = mockSessionManager.on.mock.calls.find(
        (call: [string, (...args: unknown[]) => void]) =>
          call[0] === "user-joined"
      )?.[1];

      mockEmit.mockClear();
      const userData = { id: "user_1", name: "John" };
      userJoinedHandler(userData);

      expect(mockEmit).toHaveBeenCalledWith("user-joined", userData);
    });

    it("broadcasts user-left to all clients", () => {
      const userLeftHandler = mockSessionManager.on.mock.calls.find(
        (call: [string, (...args: unknown[]) => void]) =>
          call[0] === "user-left"
      )?.[1];

      mockEmit.mockClear();
      const data = { userId: "user_1" };
      userLeftHandler(data);

      expect(mockEmit).toHaveBeenCalledWith("user-left", data);
    });

    it("broadcasts queue-updated to all clients", () => {
      const queueUpdatedHandler = mockSessionManager.on.mock.calls.find(
        (call: [string, (...args: unknown[]) => void]) =>
          call[0] === "queue-updated"
      )?.[1];

      mockEmit.mockClear();
      const queueData = [{ id: "item_1" }];
      queueUpdatedHandler(queueData);

      expect(mockEmit).toHaveBeenCalledWith("queue-updated", queueData);
    });

    it("broadcasts song-started to all clients", () => {
      const songStartedHandler = mockSessionManager.on.mock.calls.find(
        (call: [string, (...args: unknown[]) => void]) =>
          call[0] === "song-started"
      )?.[1];

      mockEmit.mockClear();
      const songData = { id: "song_1", title: "Test Song" };
      songStartedHandler(songData);

      expect(mockEmit).toHaveBeenCalledWith("song-started", songData);
    });

    it("broadcasts song-ended to all clients", () => {
      const songEndedHandler = mockSessionManager.on.mock.calls.find(
        (call: [string, (...args: unknown[]) => void]) =>
          call[0] === "song-ended"
      )?.[1];

      mockEmit.mockClear();
      const songData = { id: "song_1", title: "Done Song" };
      songEndedHandler(songData);

      expect(mockEmit).toHaveBeenCalledWith("song-ended", songData);
    });

    it("broadcasts playback-state-changed to all clients", () => {
      const playbackHandler = mockSessionManager.on.mock.calls.find(
        (call: [string, (...args: unknown[]) => void]) =>
          call[0] === "playback-state-changed"
      )?.[1];

      mockEmit.mockClear();
      const stateData = { isPlaying: true, volume: 80 };
      playbackHandler(stateData);

      expect(mockEmit).toHaveBeenCalledWith(
        "playback-state-changed",
        stateData
      );
    });
  });

  describe("socket connection handlers", () => {
    function simulateConnection() {
      mockSocketOn.mockClear();
      mockSocketEmit.mockClear();
      mockSocketJoin.mockClear();
      connectionHandler(mockSocket);
      return mockSocketOn;
    }

    function getSocketEventHandler(eventName: string) {
      const socketOn = simulateConnection();
      const handler = socketOn.mock.calls.find(
        (call: [string, (...args: unknown[]) => void]) => call[0] === eventName
      )?.[1];
      return handler;
    }

    describe("join-session", () => {
      it("creates new session when none exists", () => {
        const handler = getSocketEventHandler("join-session");
        mockSessionManager.getSession.mockReturnValue(null);
        mockSessionManager.createSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "user_1", name: "TestUser" }],
        });

        handler({ sessionId: "session_1", userName: "TestUser" });

        expect(mockSessionManager.createSession).toHaveBeenCalledWith(
          "Karaoke Session",
          "TestUser"
        );
        expect(mockSocketJoin).toHaveBeenCalledWith("session_1");
      });

      it("adds user to existing session", () => {
        const handler = getSocketEventHandler("join-session");
        mockSessionManager.getSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "host_1" }],
        });
        mockSessionManager.addUser.mockReturnValue({
          id: "user_2",
          name: "NewUser",
        });

        handler({ sessionId: "session_1", userName: "NewUser" });

        expect(mockSessionManager.addUser).toHaveBeenCalledWith(
          "NewUser",
          "socket_123"
        );
        expect(mockSocketJoin).toHaveBeenCalledWith("session_1");
      });

      it("emits session-updated to joining client", () => {
        const handler = getSocketEventHandler("join-session");
        mockSessionManager.getSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "host_1" }],
        });
        mockSessionManager.addUser.mockReturnValue({
          id: "user_2",
          name: "NewUser",
        });

        handler({ sessionId: "session_1", userName: "NewUser" });

        expect(mockSocketEmit).toHaveBeenCalledWith(
          "session-updated",
          expect.objectContaining({
            queue: expect.any(Array),
            currentSong: null,
            playbackState: expect.any(Object),
          })
        );
      });

      it("emits error on exception", () => {
        const handler = getSocketEventHandler("join-session");
        mockSessionManager.getSession.mockImplementation(() => {
          throw new Error("Session error");
        });

        handler({ sessionId: "session_1", userName: "TestUser" });

        expect(mockSocketEmit).toHaveBeenCalledWith("error", {
          code: "JOIN_SESSION_FAILED",
          message: "Session error",
        });
      });
    });

    describe("add-song", () => {
      it("emits error when not in session", () => {
        const handler = getSocketEventHandler("add-song");

        handler({ mediaItem: { id: "song_1" } });

        expect(mockSocketEmit).toHaveBeenCalledWith("error", {
          code: "NOT_IN_SESSION",
          message: "You must join a session first",
        });
      });

      it("adds song to queue after joining", () => {
        simulateConnection();

        // First join
        const joinHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "join-session"
        )?.[1];
        mockSessionManager.getSession.mockReturnValue(null);
        mockSessionManager.createSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "user_1", name: "Host" }],
        });
        joinHandler({ sessionId: "session_1", userName: "Host" });

        // Then add song
        const addSongHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "add-song"
        )?.[1];

        const mediaItem = { id: "song_1", title: "Test" };
        mockSessionManager.addSongToQueue.mockReturnValue({ success: true });

        addSongHandler({ mediaItem, position: 0 });

        expect(mockSessionManager.addSongToQueue).toHaveBeenCalledWith(
          mediaItem,
          "user_1",
          0
        );
      });

      it("emits error when addSongToQueue fails", () => {
        simulateConnection();

        const joinHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "join-session"
        )?.[1];
        mockSessionManager.getSession.mockReturnValue(null);
        mockSessionManager.createSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "user_1", name: "Host" }],
        });
        joinHandler({ sessionId: "session_1", userName: "Host" });

        const addSongHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "add-song"
        )?.[1];

        mockSessionManager.addSongToQueue.mockReturnValue({
          success: false,
          message: "Queue is full",
        });

        addSongHandler({ mediaItem: { id: "song_1" } });

        expect(mockSocketEmit).toHaveBeenCalledWith("error", {
          code: "ADD_SONG_FAILED",
          message: "Queue is full",
        });
      });

      it("emits error when addSongToQueue throws", () => {
        simulateConnection();

        const joinHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "join-session"
        )?.[1];
        mockSessionManager.getSession.mockReturnValue(null);
        mockSessionManager.createSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "user_1", name: "Host" }],
        });
        joinHandler({ sessionId: "session_1", userName: "Host" });

        const addSongHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "add-song"
        )?.[1];

        mockSessionManager.addSongToQueue.mockImplementation(() => {
          throw new Error("Internal error");
        });

        addSongHandler({ mediaItem: { id: "song_1" } });

        expect(mockSocketEmit).toHaveBeenCalledWith("error", {
          code: "ADD_SONG_FAILED",
          message: "Internal error",
        });
      });
    });

    describe("remove-song", () => {
      it("emits error when not in session", () => {
        const handler = getSocketEventHandler("remove-song");

        handler({ queueItemId: "item_1" });

        expect(mockSocketEmit).toHaveBeenCalledWith("error", {
          code: "NOT_IN_SESSION",
          message: "You must join a session first",
        });
      });

      it("removes song from queue after joining", () => {
        simulateConnection();

        const joinHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "join-session"
        )?.[1];
        mockSessionManager.getSession.mockReturnValue(null);
        mockSessionManager.createSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "user_1", name: "Host" }],
        });
        joinHandler({ sessionId: "session_1", userName: "Host" });

        const removeHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "remove-song"
        )?.[1];

        mockSessionManager.removeSongFromQueue.mockReturnValue({
          success: true,
        });

        removeHandler({ queueItemId: "item_1" });

        expect(mockSessionManager.removeSongFromQueue).toHaveBeenCalledWith(
          "item_1",
          "user_1"
        );
      });

      it("emits error when removeSongFromQueue fails", () => {
        simulateConnection();

        const joinHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "join-session"
        )?.[1];
        mockSessionManager.getSession.mockReturnValue(null);
        mockSessionManager.createSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "user_1", name: "Host" }],
        });
        joinHandler({ sessionId: "session_1", userName: "Host" });

        const removeHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "remove-song"
        )?.[1];

        mockSessionManager.removeSongFromQueue.mockReturnValue({
          success: false,
          message: "Song not found",
        });

        removeHandler({ queueItemId: "item_1" });

        expect(mockSocketEmit).toHaveBeenCalledWith("error", {
          code: "REMOVE_SONG_FAILED",
          message: "Song not found",
        });
      });
    });

    describe("reorder-queue", () => {
      it("emits error when not in session", () => {
        const handler = getSocketEventHandler("reorder-queue");

        handler({ queueItemId: "item_1", newPosition: 2 });

        expect(mockSocketEmit).toHaveBeenCalledWith("error", {
          code: "NOT_IN_SESSION",
          message: "You must join a session first",
        });
      });

      it("reorders queue after joining", () => {
        simulateConnection();

        const joinHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "join-session"
        )?.[1];
        mockSessionManager.getSession.mockReturnValue(null);
        mockSessionManager.createSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "user_1", name: "Host" }],
        });
        joinHandler({ sessionId: "session_1", userName: "Host" });

        const reorderHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "reorder-queue"
        )?.[1];

        mockSessionManager.reorderQueue.mockReturnValue({ success: true });

        reorderHandler({ queueItemId: "item_1", newPosition: 3 });

        expect(mockSessionManager.reorderQueue).toHaveBeenCalledWith(
          "item_1",
          3,
          "user_1"
        );
      });
    });

    describe("playback-control", () => {
      it("emits error when not in session", () => {
        const handler = getSocketEventHandler("playback-control");

        handler({ action: "play" });

        expect(mockSocketEmit).toHaveBeenCalledWith("error", {
          code: "NOT_IN_SESSION",
          message: "You must join a session first",
        });
      });

      it("handles play command with no current song", () => {
        simulateConnection();

        const joinHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "join-session"
        )?.[1];
        mockSessionManager.getSession.mockReturnValue(null);
        mockSessionManager.createSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "user_1", name: "Host" }],
        });
        joinHandler({ sessionId: "session_1", userName: "Host" });

        const playbackHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "playback-control"
        )?.[1];

        mockSessionManager.getCurrentSong.mockReturnValue(null);

        playbackHandler({ action: "play" });

        expect(mockSessionManager.startNextSong).toHaveBeenCalled();
      });

      it("handles play command with current song (resume)", () => {
        simulateConnection();

        const joinHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "join-session"
        )?.[1];
        mockSessionManager.getSession.mockReturnValue(null);
        mockSessionManager.createSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "user_1", name: "Host" }],
        });
        joinHandler({ sessionId: "session_1", userName: "Host" });

        const playbackHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "playback-control"
        )?.[1];

        mockSessionManager.getCurrentSong.mockReturnValue({ id: "song_1" });

        playbackHandler({ action: "play" });

        expect(mockSessionManager.updatePlaybackState).toHaveBeenCalledWith({
          isPlaying: true,
        });
      });

      it("handles pause command", () => {
        simulateConnection();

        const joinHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "join-session"
        )?.[1];
        mockSessionManager.getSession.mockReturnValue(null);
        mockSessionManager.createSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "user_1", name: "Host" }],
        });
        joinHandler({ sessionId: "session_1", userName: "Host" });

        const playbackHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "playback-control"
        )?.[1];

        playbackHandler({ action: "pause" });

        expect(mockSessionManager.updatePlaybackState).toHaveBeenCalledWith({
          isPlaying: false,
        });
      });

      it("handles volume command", () => {
        simulateConnection();

        const joinHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "join-session"
        )?.[1];
        mockSessionManager.getSession.mockReturnValue(null);
        mockSessionManager.createSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "user_1", name: "Host" }],
        });
        joinHandler({ sessionId: "session_1", userName: "Host" });

        const playbackHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "playback-control"
        )?.[1];

        playbackHandler({ action: "volume", value: 75 });

        expect(mockSessionManager.updatePlaybackState).toHaveBeenCalledWith({
          volume: 75,
        });
      });

      it("handles seek command", () => {
        simulateConnection();

        const joinHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "join-session"
        )?.[1];
        mockSessionManager.getSession.mockReturnValue(null);
        mockSessionManager.createSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "user_1", name: "Host" }],
        });
        joinHandler({ sessionId: "session_1", userName: "Host" });

        const playbackHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "playback-control"
        )?.[1];

        playbackHandler({ action: "seek", value: 30.5 });

        expect(mockSessionManager.updatePlaybackState).toHaveBeenCalledWith({
          currentTime: 30.5,
        });
      });

      it("handles mute toggle command", () => {
        simulateConnection();

        const joinHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "join-session"
        )?.[1];
        mockSessionManager.getSession.mockReturnValue(null);
        mockSessionManager.createSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "user_1", name: "Host" }],
        });
        joinHandler({ sessionId: "session_1", userName: "Host" });

        const playbackHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "playback-control"
        )?.[1];

        mockSessionManager.getPlaybackState.mockReturnValue({
          isMuted: false,
        });

        playbackHandler({ action: "mute" });

        expect(mockSessionManager.updatePlaybackState).toHaveBeenCalledWith({
          isMuted: true,
        });
      });

      it("handles lyrics-offset command with clamping to max", () => {
        simulateConnection();

        const joinHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "join-session"
        )?.[1];
        mockSessionManager.getSession.mockReturnValue(null);
        mockSessionManager.createSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "user_1", name: "Host" }],
        });
        joinHandler({ sessionId: "session_1", userName: "Host" });

        const playbackHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "playback-control"
        )?.[1];

        playbackHandler({ action: "lyrics-offset", value: 15 });

        expect(mockSessionManager.updatePlaybackState).toHaveBeenCalledWith({
          lyricsOffset: 10,
        });
      });

      it("handles lyrics-offset command with clamping to min", () => {
        simulateConnection();

        const joinHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "join-session"
        )?.[1];
        mockSessionManager.getSession.mockReturnValue(null);
        mockSessionManager.createSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "user_1", name: "Host" }],
        });
        joinHandler({ sessionId: "session_1", userName: "Host" });

        const playbackHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "playback-control"
        )?.[1];

        playbackHandler({ action: "lyrics-offset", value: -15 });

        expect(mockSessionManager.updatePlaybackState).toHaveBeenCalledWith({
          lyricsOffset: -10,
        });
      });

      it("handles lyrics-offset within range", () => {
        simulateConnection();

        const joinHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "join-session"
        )?.[1];
        mockSessionManager.getSession.mockReturnValue(null);
        mockSessionManager.createSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "user_1", name: "Host" }],
        });
        joinHandler({ sessionId: "session_1", userName: "Host" });

        const playbackHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "playback-control"
        )?.[1];

        playbackHandler({ action: "lyrics-offset", value: 3.5 });

        expect(mockSessionManager.updatePlaybackState).toHaveBeenCalledWith({
          lyricsOffset: 3.5,
        });
      });

      it("emits error on playback control exception", () => {
        simulateConnection();

        const joinHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "join-session"
        )?.[1];
        mockSessionManager.getSession.mockReturnValue(null);
        mockSessionManager.createSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "user_1", name: "Host" }],
        });
        joinHandler({ sessionId: "session_1", userName: "Host" });

        const playbackHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "playback-control"
        )?.[1];

        mockSessionManager.getCurrentSong.mockImplementation(() => {
          throw new Error("Playback error");
        });

        playbackHandler({ action: "play" });

        expect(mockSocketEmit).toHaveBeenCalledWith("error", {
          code: "PLAYBACK_CONTROL_FAILED",
          message: "Playback error",
        });
      });
    });

    describe("skip-song", () => {
      it("emits error when not in session", () => {
        const handler = getSocketEventHandler("skip-song");

        handler();

        expect(mockSocketEmit).toHaveBeenCalledWith("error", {
          code: "NOT_IN_SESSION",
          message: "You must join a session first",
        });
      });

      it("skips current song after joining", () => {
        simulateConnection();

        const joinHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "join-session"
        )?.[1];
        mockSessionManager.getSession.mockReturnValue(null);
        mockSessionManager.createSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "user_1", name: "Host" }],
        });
        joinHandler({ sessionId: "session_1", userName: "Host" });

        const skipHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "skip-song"
        )?.[1];

        mockSessionManager.skipCurrentSong.mockReturnValue({ success: true });

        skipHandler();

        expect(mockSessionManager.skipCurrentSong).toHaveBeenCalledWith(
          "user_1"
        );
      });

      it("emits error when skip fails", () => {
        simulateConnection();

        const joinHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "join-session"
        )?.[1];
        mockSessionManager.getSession.mockReturnValue(null);
        mockSessionManager.createSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "user_1", name: "Host" }],
        });
        joinHandler({ sessionId: "session_1", userName: "Host" });

        const skipHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "skip-song"
        )?.[1];

        mockSessionManager.skipCurrentSong.mockReturnValue({
          success: false,
          message: "No song playing",
        });

        skipHandler();

        expect(mockSocketEmit).toHaveBeenCalledWith("error", {
          code: "SKIP_FAILED",
          message: "No song playing",
        });
      });
    });

    describe("disconnect", () => {
      it("removes user on disconnect after joining", () => {
        simulateConnection();

        const joinHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "join-session"
        )?.[1];
        mockSessionManager.getSession.mockReturnValue(null);
        mockSessionManager.createSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "user_1", name: "Host" }],
        });
        joinHandler({ sessionId: "session_1", userName: "Host" });

        const disconnectHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "disconnect"
        )?.[1];

        disconnectHandler();

        expect(mockSessionManager.removeUser).toHaveBeenCalledWith("user_1");
      });

      it("does nothing on disconnect if not in session", () => {
        const handler = getSocketEventHandler("disconnect");

        handler();

        expect(mockSessionManager.removeUser).not.toHaveBeenCalled();
      });

      it("handles error during user removal gracefully", () => {
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});

        simulateConnection();

        const joinHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "join-session"
        )?.[1];
        mockSessionManager.getSession.mockReturnValue(null);
        mockSessionManager.createSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "user_1", name: "Host" }],
        });
        joinHandler({ sessionId: "session_1", userName: "Host" });

        const disconnectHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "disconnect"
        )?.[1];

        mockSessionManager.removeUser.mockImplementation(() => {
          throw new Error("Remove failed");
        });

        // Should not throw
        disconnectHandler();

        expect(consoleSpy).toHaveBeenCalledWith(
          "Error removing user on disconnect:",
          expect.any(Error)
        );
        consoleSpy.mockRestore();
      });
    });

    describe("user-heartbeat", () => {
      it("updates user socket ID on heartbeat after joining", () => {
        simulateConnection();

        const joinHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "join-session"
        )?.[1];
        mockSessionManager.getSession.mockReturnValue(null);
        mockSessionManager.createSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "user_1", name: "Host" }],
        });
        joinHandler({ sessionId: "session_1", userName: "Host" });

        const heartbeatHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "user-heartbeat"
        )?.[1];

        mockSessionManager.updateUserSocketId.mockClear();
        heartbeatHandler();

        expect(mockSessionManager.updateUserSocketId).toHaveBeenCalledWith(
          "user_1",
          "socket_123"
        );
      });

      it("does nothing on heartbeat if not in session", () => {
        const handler = getSocketEventHandler("user-heartbeat");

        mockSessionManager.updateUserSocketId.mockClear();
        handler();

        expect(mockSessionManager.updateUserSocketId).not.toHaveBeenCalled();
      });
    });

    describe("lyrics-sync", () => {
      it("emits error when not in session", async () => {
        const handler = getSocketEventHandler("lyrics-sync");

        await handler({ songId: "song_1", currentTime: 10.5 });

        expect(mockSocketEmit).toHaveBeenCalledWith("error", {
          code: "NOT_IN_SESSION",
          message: "You must join a session first",
        });
      });

      it("broadcasts lyrics-sync to session when sync state is returned", async () => {
        simulateConnection();

        const joinHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "join-session"
        )?.[1];
        mockSessionManager.getSession.mockReturnValue(null);
        mockSessionManager.createSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "user_1", name: "Host" }],
        });
        joinHandler({ sessionId: "session_1", userName: "Host" });

        const lyricsSyncHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "lyrics-sync"
        )?.[1];

        const syncState = {
          currentLine: "Hello world",
          currentTimestamp: 10.5,
        };
        mockUpdateSyncState.mockReturnValue(syncState);

        mockEmit.mockClear();
        mockTo.mockClear().mockReturnValue({ emit: mockEmit });

        await lyricsSyncHandler({ songId: "song_1", currentTime: 10.5 });

        expect(mockUpdateSyncState).toHaveBeenCalledWith("song_1", 10.5);
        expect(mockTo).toHaveBeenCalledWith("session_1");
        expect(mockEmit).toHaveBeenCalledWith("lyrics-sync", {
          currentLine: "Hello world",
          timestamp: 10.5,
          songId: "song_1",
          syncState,
        });
      });

      it("does not broadcast when syncState is null", async () => {
        simulateConnection();

        const joinHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "join-session"
        )?.[1];
        mockSessionManager.getSession.mockReturnValue(null);
        mockSessionManager.createSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "user_1", name: "Host" }],
        });
        joinHandler({ sessionId: "session_1", userName: "Host" });

        const lyricsSyncHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "lyrics-sync"
        )?.[1];

        mockUpdateSyncState.mockReturnValue(null);

        mockEmit.mockClear();
        mockTo.mockClear().mockReturnValue({ emit: mockEmit });

        await lyricsSyncHandler({ songId: "song_1", currentTime: 5.0 });

        expect(mockUpdateSyncState).toHaveBeenCalledWith("song_1", 5.0);
        expect(mockTo).not.toHaveBeenCalled();
        expect(mockEmit).not.toHaveBeenCalled();
      });

      it("emits error when lyrics service throws", async () => {
        simulateConnection();

        const joinHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "join-session"
        )?.[1];
        mockSessionManager.getSession.mockReturnValue(null);
        mockSessionManager.createSession.mockReturnValue({
          id: "session_1",
          connectedUsers: [{ id: "user_1", name: "Host" }],
        });
        joinHandler({ sessionId: "session_1", userName: "Host" });

        const lyricsSyncHandler = mockSocketOn.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) =>
            call[0] === "lyrics-sync"
        )?.[1];

        mockUpdateSyncState.mockImplementation(() => {
          throw new Error("Lyrics fetch failed");
        });

        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});

        await lyricsSyncHandler({ songId: "song_1", currentTime: 10.5 });

        expect(mockSocketEmit).toHaveBeenCalledWith("error", {
          code: "LYRICS_SYNC_FAILED",
          message: "Lyrics fetch failed",
        });

        consoleSpy.mockRestore();
      });
    });
  });

  describe("getWebSocketServer", () => {
    it("returns server after initialization", () => {
      const server = getWebSocketServer();
      expect(server).toBe(mockIo);
    });
  });

  describe("broadcastToSession", () => {
    it("broadcasts event to specific session", () => {
      mockEmit.mockClear();
      broadcastToSession("session_1", "queue-updated", [{ id: "item_1" }]);

      expect(mockTo).toHaveBeenCalledWith("session_1");
      expect(mockEmit).toHaveBeenCalledWith("queue-updated", [
        { id: "item_1" },
      ]);
    });
  });

  describe("broadcastToAll", () => {
    it("broadcasts event to all connected clients", () => {
      mockEmit.mockClear();
      broadcastToAll("song-started", { id: "song_1", title: "Hello" });

      expect(mockEmit).toHaveBeenCalledWith("song-started", {
        id: "song_1",
        title: "Hello",
      });
    });
  });
});
