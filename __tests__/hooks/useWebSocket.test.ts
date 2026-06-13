import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWebSocket } from "@/hooks/useWebSocket";

// Mock socket.io-client
const mockEmit = vi.fn();
const mockOn = vi.fn();
const mockOff = vi.fn();
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockRemoveAllListeners = vi.fn();

const mockSocket = {
  id: "test-socket-id",
  connected: false,
  emit: mockEmit,
  on: mockOn,
  off: mockOff,
  connect: mockConnect,
  disconnect: mockDisconnect,
  removeAllListeners: mockRemoveAllListeners,
};

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => mockSocket),
}));

describe("useWebSocket", () => {
  let eventHandlers: Record<string, (...args: unknown[]) => void>;

  beforeEach(() => {
    vi.clearAllMocks();
    eventHandlers = {};

    // Capture event handlers registered with socket.on
    mockOn.mockImplementation(
      (event: string, handler: (...args: unknown[]) => void) => {
        eventHandlers[event] = handler;
        return mockSocket;
      }
    );

    // Mock document and window for event listeners
    vi.spyOn(document, "addEventListener").mockImplementation(() => {});
    vi.spyOn(document, "removeEventListener").mockImplementation(() => {});
    vi.spyOn(window, "addEventListener").mockImplementation(() => {});
    vi.spyOn(window, "removeEventListener").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return initial state (not connected)", () => {
    const { result } = renderHook(() => useWebSocket());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.session).toBeNull();
    expect(result.current.queue).toEqual([]);
    expect(result.current.currentSong).toBeNull();
    expect(result.current.playbackState).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should call socket.connect on mount", () => {
    renderHook(() => useWebSocket());
    expect(mockConnect).toHaveBeenCalled();
  });

  it("should set isConnected to true on connect event", () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      if (eventHandlers["connect"]) {
        eventHandlers["connect"]();
      }
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("should set isConnected to false on disconnect event", () => {
    const { result } = renderHook(() => useWebSocket());

    // First connect
    act(() => {
      if (eventHandlers["connect"]) {
        eventHandlers["connect"]();
      }
    });

    // Then disconnect
    act(() => {
      if (eventHandlers["disconnect"]) {
        eventHandlers["disconnect"]("io client disconnect");
      }
    });

    expect(result.current.isConnected).toBe(false);
  });

  it("should emit join-session when joinSession is called", () => {
    mockSocket.connected = true;
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      result.current.joinSession("main-session", "TestUser");
    });

    expect(mockEmit).toHaveBeenCalledWith("join-session", {
      sessionId: "main-session",
      userName: "TestUser",
    });
  });

  it("should emit add-song when addSong is called with connected socket", async () => {
    mockSocket.connected = true;

    const { result } = renderHook(() => useWebSocket());

    const mediaItem = {
      id: "test-song-1",
      title: "Test Song",
      artist: "Test Artist",
      duration: 180,
      jellyfinId: "jf-123",
      streamUrl: "/api/stream/jf-123",
    };

    // Start the add operation (it returns a promise that resolves on queue-updated)
    act(() => {
      result.current.addSong(mediaItem);
    });

    expect(mockEmit).toHaveBeenCalledWith("add-song", {
      mediaItem,
      position: undefined,
    });
  });

  it("should emit remove-song when removeSong is called", () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      result.current.removeSong("queue-item-1");
    });

    expect(mockEmit).toHaveBeenCalledWith("remove-song", {
      queueItemId: "queue-item-1",
    });
  });

  it("should emit skip-song when skipSong is called", () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      result.current.skipSong();
    });

    expect(mockEmit).toHaveBeenCalledWith("skip-song");
  });

  it("should emit playback-control when playbackControl is called", () => {
    const { result } = renderHook(() => useWebSocket());

    const command = {
      action: "play" as const,
      userId: "test-user",
      timestamp: new Date(),
    };

    act(() => {
      result.current.playbackControl(command);
    });

    expect(mockEmit).toHaveBeenCalledWith("playback-control", command);
  });

  it("should emit song-ended when songEnded is called", () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      result.current.songEnded();
    });

    expect(mockEmit).toHaveBeenCalledWith("song-ended");
  });

  it("should emit start-next-song when startNextSong is called", () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      result.current.startNextSong();
    });

    expect(mockEmit).toHaveBeenCalledWith("start-next-song");
  });

  it("should update queue on queue-updated event", () => {
    const { result } = renderHook(() => useWebSocket());

    const newQueue = [
      {
        id: "q1",
        mediaItem: {
          id: "song-1",
          title: "Song 1",
          artist: "Artist 1",
          duration: 200,
          jellyfinId: "jf-1",
          streamUrl: "/api/stream/jf-1",
        },
        addedBy: "User1",
        addedAt: new Date(),
        position: 0,
        status: "pending" as const,
      },
    ];

    act(() => {
      if (eventHandlers["queue-updated"]) {
        eventHandlers["queue-updated"](newQueue);
      }
    });

    expect(result.current.queue).toEqual(newQueue);
  });

  it("should update currentSong on song-started event", () => {
    const { result } = renderHook(() => useWebSocket());

    const song = {
      id: "q1",
      mediaItem: {
        id: "song-1",
        title: "Song 1",
        artist: "Artist 1",
        duration: 200,
        jellyfinId: "jf-1",
        streamUrl: "/api/stream/jf-1",
      },
      addedBy: "User1",
      addedAt: new Date(),
      position: 0,
      status: "playing" as const,
    };

    act(() => {
      if (eventHandlers["song-started"]) {
        eventHandlers["song-started"](song);
      }
    });

    expect(result.current.currentSong).toEqual(song);
  });

  it("should clear currentSong on song-ended event without rating", () => {
    const { result } = renderHook(() => useWebSocket());

    // First set a current song
    act(() => {
      if (eventHandlers["song-started"]) {
        eventHandlers["song-started"]({
          id: "q1",
          mediaItem: {
            id: "s1",
            title: "T",
            artist: "A",
            duration: 100,
            jellyfinId: "j1",
            streamUrl: "/s",
          },
          addedBy: "U1",
          addedAt: new Date(),
          position: 0,
          status: "playing",
        });
      }
    });

    expect(result.current.currentSong).not.toBeNull();

    // End the song without rating
    act(() => {
      if (eventHandlers["song-ended"]) {
        eventHandlers["song-ended"](null);
      }
    });

    expect(result.current.currentSong).toBeNull();
  });

  it("should update playbackState on playback-state-changed event", () => {
    const { result } = renderHook(() => useWebSocket());

    const state = {
      isPlaying: true,
      currentTime: 45,
      volume: 80,
      isMuted: false,
      playbackRate: 1.0,
      lyricsOffset: 0,
    };

    act(() => {
      if (eventHandlers["playback-state-changed"]) {
        eventHandlers["playback-state-changed"](state);
      }
    });

    expect(result.current.playbackState).toEqual(state);
  });

  it("should ensure lyricsOffset default on playback-state-changed", () => {
    const { result } = renderHook(() => useWebSocket());

    const stateWithoutOffset = {
      isPlaying: false,
      currentTime: 0,
      volume: 80,
      isMuted: false,
      playbackRate: 1.0,
    };

    act(() => {
      if (eventHandlers["playback-state-changed"]) {
        eventHandlers["playback-state-changed"](stateWithoutOffset);
      }
    });

    expect(result.current.playbackState?.lyricsOffset).toBe(0);
  });

  it("should update session on session-joined event", () => {
    const { result } = renderHook(() => useWebSocket());

    const sessionData = {
      session: {
        id: "main-session",
        name: "Main Session",
        queue: [],
        currentSong: null,
        playbackState: {
          isPlaying: false,
          currentTime: 0,
          volume: 80,
          isMuted: false,
          playbackRate: 1.0,
          lyricsOffset: 0,
        },
        connectedUsers: [],
        hostControls: {
          autoAdvance: true,
          allowUserSkip: true,
          allowUserRemove: true,
          maxSongsPerUser: 10,
          requireApproval: false,
        },
        settings: {
          displayName: "Main",
          isPublic: true,
          maxUsers: 50,
          lyricsEnabled: true,
          crossfadeEnabled: false,
          crossfadeDuration: 3,
        },
        createdAt: new Date(),
        lastActivity: new Date(),
      },
      queue: [],
      currentSong: null,
    };

    act(() => {
      if (eventHandlers["session-joined"]) {
        eventHandlers["session-joined"](sessionData);
      }
    });

    expect(result.current.session).toEqual(sessionData.session);
    expect(result.current.error).toBeNull();
  });

  it("should set error on error event", () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      if (eventHandlers["error"]) {
        eventHandlers["error"]({
          code: "SOME_ERROR",
          message: "Something went wrong",
        });
      }
    });

    expect(result.current.error).toBe("Something went wrong");
  });

  it("should update local playback state", () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      result.current.updateLocalPlaybackState({ currentTime: 30 });
    });

    // When no previous state exists, defaults are applied
    expect(result.current.playbackState).toEqual({
      isPlaying: false,
      currentTime: 30,
      volume: 80,
      isMuted: false,
      playbackRate: 1.0,
      lyricsOffset: 0,
    });
  });

  it("should merge local playback state updates with existing state", () => {
    const { result } = renderHook(() => useWebSocket());

    // Set initial state via event
    act(() => {
      if (eventHandlers["playback-state-changed"]) {
        eventHandlers["playback-state-changed"]({
          isPlaying: true,
          currentTime: 10,
          volume: 70,
          isMuted: false,
          playbackRate: 1.0,
          lyricsOffset: 2,
        });
      }
    });

    // Update only currentTime
    act(() => {
      result.current.updateLocalPlaybackState({ currentTime: 15 });
    });

    expect(result.current.playbackState?.currentTime).toBe(15);
    expect(result.current.playbackState?.volume).toBe(70);
    expect(result.current.playbackState?.lyricsOffset).toBe(2);
  });

  it("should emit reorder-queue when reorderQueue is called", () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      result.current.reorderQueue("queue-item-1", 3);
    });

    expect(mockEmit).toHaveBeenCalledWith("reorder-queue", {
      queueItemId: "queue-item-1",
      newPosition: 3,
    });
  });

  it("should set error on connect_error event", () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      if (eventHandlers["connect_error"]) {
        eventHandlers["connect_error"]({ message: "Connection refused" });
      }
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toContain("Connection refused");
  });
});
