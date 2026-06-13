import { MutableRefObject } from "react";
import { Socket, io } from "socket.io-client";

export function createSocketFactory(clientType: string): () => Socket {
  return () =>
    io({
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true,
      query: { client: clientType },
    });
}

export function getClientType(): string {
  if (typeof window !== "undefined" && window.location.pathname === "/tv") {
    return "tv";
  }
  return "mobile";
}

interface VisibilityHandlerOptions {
  socketRef: MutableRefObject<Socket | null>;
  userNameRef: MutableRefObject<string | null>;
  createSocket: () => Socket;
  setupSocketListeners: (socket: Socket) => void;
  rejoinSession: () => void;
  hasSession: boolean;
}

export function createVisibilityHandler(
  options: VisibilityHandlerOptions
): () => void {
  const {
    socketRef,
    userNameRef,
    createSocket,
    setupSocketListeners,
    rejoinSession,
    hasSession,
  } = options;

  return () => {
    if (document.visibilityState === "visible") {
      console.log("📱 Page became visible, checking connection...");

      setTimeout(() => {
        const currentSocket = socketRef.current;
        if (!currentSocket?.connected && userNameRef.current) {
          console.log("🔄 Socket not connected, creating fresh connection...");

          if (currentSocket) {
            currentSocket.removeAllListeners();
            currentSocket.disconnect();
          }

          const newSocket = createSocket();
          socketRef.current = newSocket;
          setupSocketListeners(newSocket);
          newSocket.connect();
        } else if (
          currentSocket?.connected &&
          userNameRef.current &&
          !hasSession
        ) {
          console.log("🔄 Connected but no session, rejoining...");
          rejoinSession();
        }
      }, 1000);
    }
  };
}

interface NetworkHandlerOptions {
  socketRef: MutableRefObject<Socket | null>;
  userNameRef: MutableRefObject<string | null>;
  createSocket: () => Socket;
  setupSocketListeners: (socket: Socket) => void;
  setError: (error: string | null) => void;
}

export function createNetworkHandlers(options: NetworkHandlerOptions): {
  handleOnline: () => void;
  handleOffline: () => void;
} {
  const {
    socketRef,
    userNameRef,
    createSocket,
    setupSocketListeners,
    setError,
  } = options;

  const handleOnline = () => {
    console.log("🌐 Network back online, creating fresh connection...");
    const currentSocket = socketRef.current;

    if (userNameRef.current) {
      if (currentSocket) {
        currentSocket.removeAllListeners();
        currentSocket.disconnect();
      }

      const newSocket = createSocket();
      socketRef.current = newSocket;
      setupSocketListeners(newSocket);
      newSocket.connect();
    }
  };

  const handleOffline = () => {
    console.log("📵 Network went offline");
    setError("Network connection lost");
  };

  return { handleOnline, handleOffline };
}
