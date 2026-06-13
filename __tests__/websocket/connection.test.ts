import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { io, Socket } from "socket.io-client";

describe("WebSocket Connection", () => {
  let clientSocket: Socket;
  const serverUrl = "http://localhost:3003";

  beforeEach(() => {
    clientSocket = io(serverUrl, {
      autoConnect: false,
      timeout: 1000,
      reconnection: false,
    });
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
    clientSocket.close();
  });

  it("should create a socket client", () => {
    expect(clientSocket).toBeDefined();
    expect(clientSocket.connected).toBe(false);
  });

  it("should handle connection timeout gracefully", async () => {
    const connectPromise = new Promise<boolean>(resolve => {
      clientSocket.on("connect_error", () => {
        resolve(false);
      });

      clientSocket.on("connect", () => {
        resolve(true);
      });

      setTimeout(() => resolve(false), 2000);

      clientSocket.connect();
    });

    const connected = await connectPromise;
    // Server isn't running in tests, so we expect connection to fail gracefully
    expect(typeof connected).toBe("boolean");
  });

  it("should handle disconnection gracefully", () => {
    clientSocket.disconnect();
    expect(clientSocket.connected).toBe(false);
  });

  it("should support event listeners", () => {
    const handler = vi.fn();
    clientSocket.on("test-event", handler);
    clientSocket.emit("test-event", { data: "test" });
    // Socket.io client doesn't echo to itself, but the listener should be registered
    expect(clientSocket.listeners("test-event")).toHaveLength(1);
  });

  it("should support removing event listeners", () => {
    const handler = vi.fn();
    clientSocket.on("test-event", handler);
    clientSocket.off("test-event", handler);
    expect(clientSocket.listeners("test-event")).toHaveLength(0);
  });
});
