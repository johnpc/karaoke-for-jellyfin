// WebSocket connection tests
import { io, Socket } from "socket.io-client";

describe("WebSocket Connection", () => {
  let clientSocket: Socket;
  const serverUrl = "http://localhost:3003";

  beforeAll((done) => {
    // Wait a bit for server to be ready
    setTimeout(done, 1000);
  });

  beforeEach((done) => {
    clientSocket = io(serverUrl, {
      autoConnect: false,
    });

    clientSocket.on("connect", () => {
      done();
    });

    clientSocket.connect();
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  it("should connect to WebSocket server", (done) => {
    expect(clientSocket.connected).toBe(true);
    done();
  });

  it("should be able to join a session", (done) => {
    clientSocket.emit("join-session", {
      sessionId: "test-session",
      userName: "Test User",
    });

    clientSocket.on("session-updated", (data) => {
      expect(data).toBeDefined();
      expect(data.session).toBeDefined();
      expect(data.session.id).toBe("test-session");
      expect(data.queue).toBeDefined();
      done();
    });
  });

  it("should handle adding songs to queue", (done) => {
    // First join a session
    clientSocket.emit("join-session", {
      sessionId: "test-session",
      userName: "Test User",
    });

    clientSocket.on("session-updated", () => {
      // Now try to add a song
      clientSocket.emit("add-song", {
        mediaItem: {
          id: "test-song-1",
          title: "Test Song",
          artist: "Test Artist",
          duration: 180,
          jellyfinId: "jellyfin-123",
          streamUrl: "http://test.com/stream",
        },
      });
    });

    clientSocket.on("queue-updated", (queue) => {
      expect(queue).toHaveLength(1);
      expect(queue[0].mediaItem.title).toBe("Test Song");
      expect(queue[0].status).toBe("pending");
      done();
    });
  });

  it("should handle playback controls", (done) => {
    clientSocket.emit("join-session", {
      sessionId: "test-session-2",
      userName: "Test User",
    });

    clientSocket.on("session-updated", () => {
      clientSocket.emit("playback-control", {
        action: "play",
        userId: "test-user",
        timestamp: new Date(),
      });
    });

    clientSocket.on("playback-state-changed", (state) => {
      expect(state.action).toBe("play");
      done();
    });
  });

  it("should handle disconnection gracefully", (done) => {
    clientSocket.on("disconnect", () => {
      expect(clientSocket.connected).toBe(false);
      done();
    });

    clientSocket.disconnect();
  });
});
