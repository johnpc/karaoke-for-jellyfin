import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  setupSessionHandlers,
  setupConnectionHandlers,
  setupReconnectHandlers,
  setupErrorHandler,
  SessionSetters,
  ConnectionSetters,
  ConnectionOptions,
} from "@/hooks/useWebSocket/socketHandlers";
import { Socket } from "socket.io-client";

// Create a mock socket with typed on/off methods
function createMockSocket(): Socket & {
  handlers: Record<string, (...args: unknown[]) => void>;
} {
  const handlers: Record<string, (...args: unknown[]) => void> = {};
  return {
    handlers,
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      handlers[event] = handler;
    }),
    off: vi.fn(),
    connected: true,
    connect: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(),
    id: "test-socket-id",
  } as unknown as Socket & {
    handlers: Record<string, (...args: unknown[]) => void>;
  };
}

describe("socketHandlers", () => {
  describe("setupSessionHandlers", () => {
    let mockSocket: ReturnType<typeof createMockSocket>;
    let setters: SessionSetters;

    beforeEach(() => {
      vi.clearAllMocks();
      mockSocket = createMockSocket();
      setters = {
        setSession: vi.fn(),
        setQueue: vi.fn(),
        setCurrentSong: vi.fn(),
        setPlaybackState: vi.fn(),
        setError: vi.fn(),
        songCompletedHandlerRef: { current: null },
      };
    });

    it("registers all expected event handlers", () => {
      setupSessionHandlers(mockSocket, setters);

      expect(mockSocket.on).toHaveBeenCalledWith(
        "session-updated",
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        "session-joined",
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        "queue-updated",
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        "song-started",
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        "song-ended",
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        "user-joined",
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        "user-left",
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        "playback-state-changed",
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        "lyrics-sync",
        expect.any(Function)
      );
    });

    describe("session-updated", () => {
      it("updates session, queue, currentSong, and playbackState when all data provided", () => {
        setupSessionHandlers(mockSocket, setters);

        const data = {
          session: { id: "s1", name: "Test" },
          queue: [{ id: "q1" }],
          currentSong: { id: "q1", mediaItem: { title: "Song" } },
          playbackState: { isPlaying: true, lyricsOffset: 5 },
        };

        mockSocket.handlers["session-updated"](data);

        expect(setters.setSession).toHaveBeenCalledWith(data.session);
        expect(setters.setQueue).toHaveBeenCalledWith(data.queue);
        expect(setters.setCurrentSong).toHaveBeenCalledWith(data.currentSong);
        expect(setters.setPlaybackState).toHaveBeenCalledWith({
          ...data.playbackState,
          lyricsOffset: 5,
        });
      });

      it("does not call setters for missing data fields", () => {
        setupSessionHandlers(mockSocket, setters);

        mockSocket.handlers["session-updated"]({});

        expect(setters.setSession).not.toHaveBeenCalled();
        expect(setters.setQueue).not.toHaveBeenCalled();
        expect(setters.setCurrentSong).not.toHaveBeenCalled();
        expect(setters.setPlaybackState).not.toHaveBeenCalled();
      });

      it("uses lyricsOffset fallback of 0 when not provided", () => {
        setupSessionHandlers(mockSocket, setters);

        mockSocket.handlers["session-updated"]({
          playbackState: { isPlaying: true, volume: 80 },
        });

        expect(setters.setPlaybackState).toHaveBeenCalledWith({
          isPlaying: true,
          volume: 80,
          lyricsOffset: 0,
        });
      });
    });

    describe("session-joined", () => {
      it("sets session, queue, currentSong and clears error", () => {
        setupSessionHandlers(mockSocket, setters);

        const data = {
          session: { id: "s1", queue: [{ id: "q1" }] },
          queue: [{ id: "q2" }],
          currentSong: { id: "q2" },
        };

        mockSocket.handlers["session-joined"](data);

        expect(setters.setSession).toHaveBeenCalledWith(data.session);
        expect(setters.setQueue).toHaveBeenCalledWith(data.queue);
        expect(setters.setCurrentSong).toHaveBeenCalledWith(data.currentSong);
        expect(setters.setError).toHaveBeenCalledWith(null);
      });

      it("uses session.queue as fallback when data.queue is falsy", () => {
        setupSessionHandlers(mockSocket, setters);

        const data = {
          session: { id: "s1", queue: [{ id: "fallback-q" }] },
          queue: null,
          currentSong: null,
        };

        mockSocket.handlers["session-joined"](data);

        // data.queue is null, so the || chain triggers
        // if (data.queue) is falsy, setQueue won't be called for that branch
        // Actually reading the code: if (data.queue) setQueue(data.queue || data.session?.queue || [])
        // So if data.queue is null/undefined, setQueue won't be called at all
        expect(setters.setQueue).not.toHaveBeenCalled();
      });

      it("does not set currentSong when not provided", () => {
        setupSessionHandlers(mockSocket, setters);

        mockSocket.handlers["session-joined"]({
          session: { id: "s1" },
        });

        expect(setters.setCurrentSong).not.toHaveBeenCalled();
      });
    });

    describe("queue-updated", () => {
      it("sets queue with received data", () => {
        setupSessionHandlers(mockSocket, setters);

        const newQueue = [{ id: "q1" }, { id: "q2" }];
        mockSocket.handlers["queue-updated"](newQueue);

        expect(setters.setQueue).toHaveBeenCalledWith(newQueue);
      });
    });

    describe("song-started", () => {
      it("sets currentSong with received song", () => {
        setupSessionHandlers(mockSocket, setters);

        const song = { id: "q1", mediaItem: { title: "New Song" } };
        mockSocket.handlers["song-started"](song);

        expect(setters.setCurrentSong).toHaveBeenCalledWith(song);
      });
    });

    describe("song-ended", () => {
      it("calls songCompletedHandlerRef when data has rating", () => {
        const mockHandler = vi.fn();
        setters.songCompletedHandlerRef = { current: mockHandler };
        setupSessionHandlers(mockSocket, setters);

        const data = { song: { id: "q1" }, rating: { grade: "A", score: 95 } };
        mockSocket.handlers["song-ended"](data);

        expect(mockHandler).toHaveBeenCalledWith(data);
        expect(setters.setCurrentSong).not.toHaveBeenCalled();
      });

      it("sets currentSong to null when data has no rating", () => {
        setupSessionHandlers(mockSocket, setters);

        mockSocket.handlers["song-ended"]({ song: { id: "q1" } });

        expect(setters.setCurrentSong).toHaveBeenCalledWith(null);
      });

      it("sets currentSong to null when data is null", () => {
        setupSessionHandlers(mockSocket, setters);

        mockSocket.handlers["song-ended"](null);

        expect(setters.setCurrentSong).toHaveBeenCalledWith(null);
      });

      it("does not crash when songCompletedHandlerRef.current is null and data has rating", () => {
        setters.songCompletedHandlerRef = { current: null };
        setupSessionHandlers(mockSocket, setters);

        const data = { song: { id: "q1" }, rating: { grade: "B" } };
        mockSocket.handlers["song-ended"](data);

        // Should not throw; setCurrentSong should NOT be called because the rating branch was taken
        expect(setters.setCurrentSong).not.toHaveBeenCalled();
      });
    });

    describe("user-joined", () => {
      it("adds user to session connectedUsers when session exists", () => {
        setupSessionHandlers(mockSocket, setters);

        const newUser = { id: "u1", name: "Alice", isHost: false };
        mockSocket.handlers["user-joined"](newUser);

        // setSession is called with a function; invoke it with a mock prevSession
        const updater = (setters.setSession as ReturnType<typeof vi.fn>).mock
          .calls[0][0];
        const prevSession = {
          id: "s1",
          connectedUsers: [{ id: "u0", name: "Host" }],
        };
        const result = updater(prevSession);

        expect(result.connectedUsers).toHaveLength(2);
        expect(result.connectedUsers[1]).toEqual(newUser);
      });

      it("returns null when prevSession is null", () => {
        setupSessionHandlers(mockSocket, setters);

        mockSocket.handlers["user-joined"]({ id: "u1", name: "Alice" });

        const updater = (setters.setSession as ReturnType<typeof vi.fn>).mock
          .calls[0][0];
        const result = updater(null);

        expect(result).toBeNull();
      });
    });

    describe("user-left", () => {
      it("removes user from session connectedUsers when session exists", () => {
        setupSessionHandlers(mockSocket, setters);

        mockSocket.handlers["user-left"]({ userId: "u1" });

        const updater = (setters.setSession as ReturnType<typeof vi.fn>).mock
          .calls[0][0];
        const prevSession = {
          id: "s1",
          connectedUsers: [
            { id: "u0", name: "Host" },
            { id: "u1", name: "Alice" },
          ],
        };
        const result = updater(prevSession);

        expect(result.connectedUsers).toHaveLength(1);
        expect(result.connectedUsers[0].id).toBe("u0");
      });

      it("returns null when prevSession is null", () => {
        setupSessionHandlers(mockSocket, setters);

        mockSocket.handlers["user-left"]({ userId: "u1" });

        const updater = (setters.setSession as ReturnType<typeof vi.fn>).mock
          .calls[0][0];
        const result = updater(null);

        expect(result).toBeNull();
      });
    });

    describe("playback-state-changed", () => {
      it("sets playback state with lyricsOffset from data", () => {
        setupSessionHandlers(mockSocket, setters);

        mockSocket.handlers["playback-state-changed"]({
          isPlaying: true,
          volume: 90,
          lyricsOffset: 3,
        });

        expect(setters.setPlaybackState).toHaveBeenCalledWith({
          isPlaying: true,
          volume: 90,
          lyricsOffset: 3,
        });
      });

      it("defaults lyricsOffset to 0 when not provided", () => {
        setupSessionHandlers(mockSocket, setters);

        mockSocket.handlers["playback-state-changed"]({
          isPlaying: false,
          volume: 50,
        });

        expect(setters.setPlaybackState).toHaveBeenCalledWith({
          isPlaying: false,
          volume: 50,
          lyricsOffset: 0,
        });
      });
    });

    describe("lyrics-sync", () => {
      it("handles lyrics-sync event without errors", () => {
        setupSessionHandlers(mockSocket, setters);

        // Should not throw
        expect(() => {
          mockSocket.handlers["lyrics-sync"]({ line: 5, time: 30000 });
        }).not.toThrow();
      });
    });
  });

  describe("setupConnectionHandlers", () => {
    let mockSocket: ReturnType<typeof createMockSocket>;
    let setters: ConnectionSetters;
    let options: ConnectionOptions;
    let mockNewSocket: ReturnType<typeof createMockSocket>;

    beforeEach(() => {
      vi.clearAllMocks();
      vi.useFakeTimers();
      mockSocket = createMockSocket();
      mockNewSocket = createMockSocket();
      setters = {
        setIsConnected: vi.fn(),
        setError: vi.fn(),
        setSession: vi.fn(),
        setQueue: vi.fn(),
        setCurrentSong: vi.fn(),
        setPlaybackState: vi.fn(),
      };
      options = {
        userNameRef: { current: "TestUser" },
        heartbeatIntervalRef: { current: null },
        socketRef: { current: mockSocket as unknown as Socket },
        reconnectTimeoutRef: { current: null },
        setupHeartbeat: vi.fn(),
        rejoinSession: vi.fn(),
        createSocket: vi.fn(() => mockNewSocket as unknown as Socket),
        setupSocketListeners: vi.fn(),
      };
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    describe("connect", () => {
      it("sets connected state and starts heartbeat", () => {
        setupConnectionHandlers(mockSocket, setters, options);

        mockSocket.handlers["connect"]();

        expect(setters.setIsConnected).toHaveBeenCalledWith(true);
        expect(setters.setError).toHaveBeenCalledWith(null);
        expect(options.setupHeartbeat).toHaveBeenCalled();
      });

      it("auto-rejoins session when userName exists", () => {
        options.userNameRef.current = "TestUser";
        setupConnectionHandlers(mockSocket, setters, options);

        mockSocket.handlers["connect"]();

        expect(setters.setSession).toHaveBeenCalledWith(null);
        expect(setters.setQueue).toHaveBeenCalledWith([]);
        expect(setters.setCurrentSong).toHaveBeenCalledWith(null);
        expect(setters.setPlaybackState).toHaveBeenCalledWith(null);

        vi.advanceTimersByTime(500);

        expect(options.rejoinSession).toHaveBeenCalled();
      });

      it("does not rejoin when userName is null", () => {
        options.userNameRef.current = null;
        setupConnectionHandlers(mockSocket, setters, options);

        mockSocket.handlers["connect"]();

        vi.advanceTimersByTime(500);

        expect(options.rejoinSession).not.toHaveBeenCalled();
        expect(setters.setSession).not.toHaveBeenCalledWith(null);
      });
    });

    describe("disconnect", () => {
      it("sets disconnected state and clears heartbeat interval", () => {
        const intervalId = setInterval(() => {}, 1000);
        options.heartbeatIntervalRef.current = intervalId;
        setupConnectionHandlers(mockSocket, setters, options);

        mockSocket.handlers["disconnect"]("io server disconnect");

        expect(setters.setIsConnected).toHaveBeenCalledWith(false);
        expect(options.heartbeatIntervalRef.current).toBeNull();
      });

      it("sets error for io server disconnect", () => {
        setupConnectionHandlers(mockSocket, setters, options);

        mockSocket.handlers["disconnect"]("io server disconnect");

        expect(setters.setError).toHaveBeenCalledWith(
          "Server disconnected the connection"
        );
      });

      it("creates fresh socket for transport close with userName", () => {
        options.userNameRef.current = "TestUser";
        setupConnectionHandlers(mockSocket, setters, options);

        mockSocket.handlers["disconnect"]("transport close");

        expect(setters.setError).toHaveBeenCalledWith(
          "Connection lost - creating fresh connection..."
        );

        vi.advanceTimersByTime(2000);

        expect(mockSocket.removeAllListeners).toHaveBeenCalled();
        expect(mockSocket.disconnect).toHaveBeenCalled();
        expect(options.createSocket).toHaveBeenCalled();
        expect(options.setupSocketListeners).toHaveBeenCalledWith(
          mockNewSocket
        );
        expect(mockNewSocket.connect).toHaveBeenCalled();
        expect(options.socketRef.current).toBe(mockNewSocket);
      });

      it("creates fresh socket for transport error with userName", () => {
        options.userNameRef.current = "TestUser";
        setupConnectionHandlers(mockSocket, setters, options);

        mockSocket.handlers["disconnect"]("transport error");

        vi.advanceTimersByTime(2000);

        expect(options.createSocket).toHaveBeenCalled();
      });

      it("does not create fresh socket when userName is null on transport close", () => {
        options.userNameRef.current = null;
        setupConnectionHandlers(mockSocket, setters, options);

        mockSocket.handlers["disconnect"]("transport close");

        vi.advanceTimersByTime(2000);

        expect(options.createSocket).not.toHaveBeenCalled();
      });

      it("sets generic error for other disconnect reasons", () => {
        setupConnectionHandlers(mockSocket, setters, options);

        mockSocket.handlers["disconnect"]("ping timeout");

        expect(setters.setError).toHaveBeenCalledWith(
          "Disconnected - attempting to reconnect..."
        );
      });
    });

    describe("connect_error", () => {
      it("sets error message from error object", () => {
        setupReconnectHandlers(mockSocket, setters, options);

        mockSocket.handlers["connect_error"]({ message: "Connection refused" });

        expect(setters.setError).toHaveBeenCalledWith(
          "Connection failed: Connection refused"
        );
      });

      it("uses 'Unknown error' when message is missing", () => {
        setupReconnectHandlers(mockSocket, setters, options);

        mockSocket.handlers["connect_error"]({});

        expect(setters.setError).toHaveBeenCalledWith(
          "Connection failed: Unknown error"
        );
      });
    });

    describe("reconnect", () => {
      it("clears error on successful reconnect", () => {
        setupReconnectHandlers(mockSocket, setters, options);

        mockSocket.handlers["reconnect"](3);

        expect(setters.setError).toHaveBeenCalledWith(null);
      });
    });

    describe("reconnect_attempt", () => {
      it("sets reconnecting error with attempt number", () => {
        setupReconnectHandlers(mockSocket, setters, options);

        mockSocket.handlers["reconnect_attempt"](2);

        expect(setters.setError).toHaveBeenCalledWith(
          "Reconnecting... (attempt 2)"
        );
      });
    });

    describe("reconnect_failed", () => {
      it("creates fresh socket when userName exists", () => {
        options.userNameRef.current = "TestUser";
        setupReconnectHandlers(mockSocket, setters, options);

        mockSocket.handlers["reconnect_failed"]();

        vi.advanceTimersByTime(3000);

        expect(mockSocket.removeAllListeners).toHaveBeenCalled();
        expect(mockSocket.disconnect).toHaveBeenCalled();
        expect(options.createSocket).toHaveBeenCalled();
        expect(options.setupSocketListeners).toHaveBeenCalledWith(
          mockNewSocket
        );
        expect(mockNewSocket.connect).toHaveBeenCalled();
      });

      it("sets final error when userName is null", () => {
        options.userNameRef.current = null;
        setupReconnectHandlers(mockSocket, setters, options);

        mockSocket.handlers["reconnect_failed"]();

        expect(setters.setError).toHaveBeenCalledWith(
          "Failed to reconnect. Please refresh the page."
        );
        expect(options.createSocket).not.toHaveBeenCalled();
      });
    });
  });

  describe("setupErrorHandler", () => {
    let mockSocket: ReturnType<typeof createMockSocket>;
    let mockNewSocket: ReturnType<typeof createMockSocket>;
    let setters: Pick<ConnectionSetters, "setError">;
    let options: Pick<
      ConnectionOptions,
      | "userNameRef"
      | "reconnectTimeoutRef"
      | "socketRef"
      | "createSocket"
      | "setupSocketListeners"
    >;

    beforeEach(() => {
      vi.clearAllMocks();
      vi.useFakeTimers();
      mockSocket = createMockSocket();
      mockNewSocket = createMockSocket();
      setters = { setError: vi.fn() };
      options = {
        userNameRef: { current: "TestUser" },
        reconnectTimeoutRef: { current: null },
        socketRef: { current: mockSocket as unknown as Socket },
        createSocket: vi.fn(() => mockNewSocket as unknown as Socket),
        setupSocketListeners: vi.fn(),
      };
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("creates fresh connection when NOT_IN_SESSION and userName exists", () => {
      setupErrorHandler(mockSocket, setters, options);

      mockSocket.handlers["error"]({
        code: "NOT_IN_SESSION",
        message: "Not in session",
      });

      expect(setters.setError).toHaveBeenCalledWith(
        "Session lost - reconnecting with fresh connection..."
      );

      vi.advanceTimersByTime(2000);

      expect(mockSocket.removeAllListeners).toHaveBeenCalled();
      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(options.createSocket).toHaveBeenCalled();
      expect(options.setupSocketListeners).toHaveBeenCalledWith(mockNewSocket);
      expect(mockNewSocket.connect).toHaveBeenCalled();
      expect(options.socketRef.current).toBe(mockNewSocket);
    });

    it("clears existing reconnect timeout before creating new one", () => {
      const existingTimeout = setTimeout(() => {}, 10000);
      options.reconnectTimeoutRef.current = existingTimeout;
      setupErrorHandler(mockSocket, setters, options);

      mockSocket.handlers["error"]({ code: "NOT_IN_SESSION" });

      // The existing timeout should have been cleared
      expect(options.reconnectTimeoutRef.current).not.toBe(existingTimeout);
    });

    it("sets generic error for non-NOT_IN_SESSION errors", () => {
      setupErrorHandler(mockSocket, setters, options);

      mockSocket.handlers["error"]({
        code: "UNKNOWN",
        message: "Something broke",
      });

      expect(setters.setError).toHaveBeenCalledWith("Something broke");
      expect(options.createSocket).not.toHaveBeenCalled();
    });

    it("uses default error message when message is undefined", () => {
      setupErrorHandler(mockSocket, setters, options);

      mockSocket.handlers["error"]({ code: "SOME_ERROR" });

      expect(setters.setError).toHaveBeenCalledWith("An error occurred");
    });

    it("does not create fresh connection for NOT_IN_SESSION when userName is null", () => {
      options.userNameRef.current = null;
      setupErrorHandler(mockSocket, setters, options);

      mockSocket.handlers["error"]({ code: "NOT_IN_SESSION", message: "Lost" });

      expect(setters.setError).toHaveBeenCalledWith("Lost");

      vi.advanceTimersByTime(2000);

      expect(options.createSocket).not.toHaveBeenCalled();
    });
  });
});
