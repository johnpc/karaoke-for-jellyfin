import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createSocketFactory,
  getClientType,
  createVisibilityHandler,
  createNetworkHandlers,
} from "@/hooks/useWebSocket/connectionManager";

// Mock socket.io-client
const mockSocket = {
  connected: false,
  connect: vi.fn(),
  disconnect: vi.fn(),
  removeAllListeners: vi.fn(),
  on: vi.fn(),
};

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => mockSocket),
}));

describe("connectionManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSocketFactory", () => {
    it("returns a function", () => {
      const factory = createSocketFactory("mobile");
      expect(typeof factory).toBe("function");
    });

    it("creates a socket with the correct client type query param", async () => {
      const { io } = await import("socket.io-client");
      const factory = createSocketFactory("tv");
      factory();

      expect(io).toHaveBeenCalledWith(
        expect.objectContaining({
          autoConnect: false,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          forceNew: true,
          query: { client: "tv" },
        })
      );
    });

    it("creates a socket with mobile client type", async () => {
      const { io } = await import("socket.io-client");
      const factory = createSocketFactory("mobile");
      factory();

      expect(io).toHaveBeenCalledWith(
        expect.objectContaining({
          query: { client: "mobile" },
        })
      );
    });

    it("returns the socket instance from io()", () => {
      const factory = createSocketFactory("mobile");
      const result = factory();
      expect(result).toBe(mockSocket);
    });
  });

  describe("getClientType", () => {
    it("returns 'tv' when pathname is /tv", () => {
      Object.defineProperty(window, "location", {
        value: { pathname: "/tv" },
        writable: true,
      });
      expect(getClientType()).toBe("tv");
    });

    it("returns 'mobile' when pathname is not /tv", () => {
      Object.defineProperty(window, "location", {
        value: { pathname: "/mobile" },
        writable: true,
      });
      expect(getClientType()).toBe("mobile");
    });

    it("returns 'mobile' for root path", () => {
      Object.defineProperty(window, "location", {
        value: { pathname: "/" },
        writable: true,
      });
      expect(getClientType()).toBe("mobile");
    });

    it("returns 'mobile' for /tv-settings path", () => {
      Object.defineProperty(window, "location", {
        value: { pathname: "/tv-settings" },
        writable: true,
      });
      expect(getClientType()).toBe("mobile");
    });
  });

  describe("createVisibilityHandler", () => {
    it("returns a function", () => {
      const handler = createVisibilityHandler({
        socketRef: { current: null },
        userNameRef: { current: null },
        createSocket: vi.fn(),
        setupSocketListeners: vi.fn(),
        rejoinSession: vi.fn(),
        hasSession: false,
      });
      expect(typeof handler).toBe("function");
    });

    it("does nothing when document is hidden", () => {
      Object.defineProperty(document, "visibilityState", {
        value: "hidden",
        writable: true,
      });

      const createSocket = vi.fn();
      const handler = createVisibilityHandler({
        socketRef: { current: null },
        userNameRef: { current: "TestUser" },
        createSocket,
        setupSocketListeners: vi.fn(),
        rejoinSession: vi.fn(),
        hasSession: false,
      });

      handler();
      expect(createSocket).not.toHaveBeenCalled();
    });

    it("creates a new socket when visible and disconnected", () => {
      vi.useFakeTimers();
      Object.defineProperty(document, "visibilityState", {
        value: "visible",
        writable: true,
      });

      const newSocket = {
        connected: false,
        connect: vi.fn(),
        removeAllListeners: vi.fn(),
        disconnect: vi.fn(),
      };
      const createSocket = vi.fn(() => newSocket);
      const setupSocketListeners = vi.fn();
      const socketRef = {
        current: {
          connected: false,
          removeAllListeners: vi.fn(),
          disconnect: vi.fn(),
        },
      };

      const handler = createVisibilityHandler({
        socketRef: socketRef as unknown as {
          current: ReturnType<typeof import("socket.io-client").io> | null;
        },
        userNameRef: { current: "TestUser" },
        createSocket: createSocket as unknown as () => ReturnType<
          typeof import("socket.io-client").io
        >,
        setupSocketListeners: setupSocketListeners as unknown as (
          socket: ReturnType<typeof import("socket.io-client").io>
        ) => void,
        rejoinSession: vi.fn(),
        hasSession: false,
      });

      handler();
      vi.advanceTimersByTime(1000);

      expect(createSocket).toHaveBeenCalled();
      expect(setupSocketListeners).toHaveBeenCalledWith(newSocket);
      expect(newSocket.connect).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it("calls rejoinSession when connected but no session", () => {
      vi.useFakeTimers();
      Object.defineProperty(document, "visibilityState", {
        value: "visible",
        writable: true,
      });

      const rejoinSession = vi.fn();
      const socketRef = {
        current: {
          connected: true,
          removeAllListeners: vi.fn(),
          disconnect: vi.fn(),
        },
      };

      const handler = createVisibilityHandler({
        socketRef: socketRef as unknown as {
          current: ReturnType<typeof import("socket.io-client").io> | null;
        },
        userNameRef: { current: "TestUser" },
        createSocket: vi.fn() as unknown as () => ReturnType<
          typeof import("socket.io-client").io
        >,
        setupSocketListeners: vi.fn(),
        rejoinSession,
        hasSession: false,
      });

      handler();
      vi.advanceTimersByTime(1000);

      expect(rejoinSession).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it("does not reconnect when no userName", () => {
      vi.useFakeTimers();
      Object.defineProperty(document, "visibilityState", {
        value: "visible",
        writable: true,
      });

      const createSocket = vi.fn();
      const socketRef = {
        current: {
          connected: false,
          removeAllListeners: vi.fn(),
          disconnect: vi.fn(),
        },
      };

      const handler = createVisibilityHandler({
        socketRef: socketRef as unknown as {
          current: ReturnType<typeof import("socket.io-client").io> | null;
        },
        userNameRef: { current: null },
        createSocket: createSocket as unknown as () => ReturnType<
          typeof import("socket.io-client").io
        >,
        setupSocketListeners: vi.fn(),
        rejoinSession: vi.fn(),
        hasSession: false,
      });

      handler();
      vi.advanceTimersByTime(1000);

      expect(createSocket).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it("disconnects old socket before creating new one", () => {
      vi.useFakeTimers();
      Object.defineProperty(document, "visibilityState", {
        value: "visible",
        writable: true,
      });

      const oldSocket = {
        connected: false,
        removeAllListeners: vi.fn(),
        disconnect: vi.fn(),
      };
      const newSocket = {
        connected: false,
        connect: vi.fn(),
        removeAllListeners: vi.fn(),
        disconnect: vi.fn(),
      };
      const createSocket = vi.fn(() => newSocket);
      const socketRef = { current: oldSocket };

      const handler = createVisibilityHandler({
        socketRef: socketRef as unknown as {
          current: ReturnType<typeof import("socket.io-client").io> | null;
        },
        userNameRef: { current: "TestUser" },
        createSocket: createSocket as unknown as () => ReturnType<
          typeof import("socket.io-client").io
        >,
        setupSocketListeners: vi.fn(),
        rejoinSession: vi.fn(),
        hasSession: false,
      });

      handler();
      vi.advanceTimersByTime(1000);

      expect(oldSocket.removeAllListeners).toHaveBeenCalled();
      expect(oldSocket.disconnect).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe("createNetworkHandlers", () => {
    it("returns handleOnline and handleOffline functions", () => {
      const handlers = createNetworkHandlers({
        socketRef: { current: null },
        userNameRef: { current: null },
        createSocket: vi.fn() as unknown as () => ReturnType<
          typeof import("socket.io-client").io
        >,
        setupSocketListeners: vi.fn(),
        setError: vi.fn(),
      });

      expect(typeof handlers.handleOnline).toBe("function");
      expect(typeof handlers.handleOffline).toBe("function");
    });

    it("handleOffline sets error message", () => {
      const setError = vi.fn();
      const { handleOffline } = createNetworkHandlers({
        socketRef: { current: null },
        userNameRef: { current: null },
        createSocket: vi.fn() as unknown as () => ReturnType<
          typeof import("socket.io-client").io
        >,
        setupSocketListeners: vi.fn(),
        setError,
      });

      handleOffline();
      expect(setError).toHaveBeenCalledWith("Network connection lost");
    });

    it("handleOnline creates new socket when userName exists", () => {
      const newSocket = {
        connected: false,
        connect: vi.fn(),
        removeAllListeners: vi.fn(),
        disconnect: vi.fn(),
      };
      const createSocket = vi.fn(() => newSocket);
      const setupSocketListeners = vi.fn();
      const socketRef = { current: null };

      const { handleOnline } = createNetworkHandlers({
        socketRef: socketRef as unknown as {
          current: ReturnType<typeof import("socket.io-client").io> | null;
        },
        userNameRef: { current: "TestUser" },
        createSocket: createSocket as unknown as () => ReturnType<
          typeof import("socket.io-client").io
        >,
        setupSocketListeners: setupSocketListeners as unknown as (
          socket: ReturnType<typeof import("socket.io-client").io>
        ) => void,
        setError: vi.fn(),
      });

      handleOnline();

      expect(createSocket).toHaveBeenCalled();
      expect(setupSocketListeners).toHaveBeenCalledWith(newSocket);
      expect(newSocket.connect).toHaveBeenCalled();
    });

    it("handleOnline does nothing when no userName", () => {
      const createSocket = vi.fn();
      const { handleOnline } = createNetworkHandlers({
        socketRef: { current: null },
        userNameRef: { current: null },
        createSocket: createSocket as unknown as () => ReturnType<
          typeof import("socket.io-client").io
        >,
        setupSocketListeners: vi.fn(),
        setError: vi.fn(),
      });

      handleOnline();
      expect(createSocket).not.toHaveBeenCalled();
    });

    it("handleOnline disconnects existing socket before creating new", () => {
      const oldSocket = {
        connected: true,
        removeAllListeners: vi.fn(),
        disconnect: vi.fn(),
      };
      const newSocket = {
        connected: false,
        connect: vi.fn(),
        removeAllListeners: vi.fn(),
        disconnect: vi.fn(),
      };
      const createSocket = vi.fn(() => newSocket);
      const socketRef = { current: oldSocket };

      const { handleOnline } = createNetworkHandlers({
        socketRef: socketRef as unknown as {
          current: ReturnType<typeof import("socket.io-client").io> | null;
        },
        userNameRef: { current: "TestUser" },
        createSocket: createSocket as unknown as () => ReturnType<
          typeof import("socket.io-client").io
        >,
        setupSocketListeners: vi.fn() as unknown as (
          socket: ReturnType<typeof import("socket.io-client").io>
        ) => void,
        setError: vi.fn(),
      });

      handleOnline();

      expect(oldSocket.removeAllListeners).toHaveBeenCalled();
      expect(oldSocket.disconnect).toHaveBeenCalled();
    });
  });
});
