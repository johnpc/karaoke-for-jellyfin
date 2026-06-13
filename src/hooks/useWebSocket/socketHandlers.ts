import { Socket } from "socket.io-client";
import { Dispatch, SetStateAction, MutableRefObject } from "react";
import {
  KaraokeSession,
  QueueItem,
  PlaybackState,
  ConnectedUser,
} from "@/types";

export interface SessionSetters {
  setSession: Dispatch<SetStateAction<KaraokeSession | null>>;
  setQueue: Dispatch<SetStateAction<QueueItem[]>>;
  setCurrentSong: Dispatch<SetStateAction<QueueItem | null>>;
  setPlaybackState: Dispatch<SetStateAction<PlaybackState | null>>;
  setError: Dispatch<SetStateAction<string | null>>;
  songCompletedHandlerRef: MutableRefObject<
    ((data: { song: QueueItem; rating: unknown }) => void) | null
  >;
}

export interface ConnectionSetters {
  setIsConnected: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setSession: Dispatch<SetStateAction<KaraokeSession | null>>;
  setQueue: Dispatch<SetStateAction<QueueItem[]>>;
  setCurrentSong: Dispatch<SetStateAction<QueueItem | null>>;
  setPlaybackState: Dispatch<SetStateAction<PlaybackState | null>>;
}

export interface ConnectionOptions {
  userNameRef: MutableRefObject<string | null>;
  heartbeatIntervalRef: MutableRefObject<NodeJS.Timeout | null>;
  socketRef: MutableRefObject<Socket | null>;
  reconnectTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  setupHeartbeat: () => void;
  rejoinSession: () => void;
  createSocket: () => Socket;
  setupSocketListeners: (socket: Socket) => void;
}

function setupQueueHandlers(
  socketInstance: Socket,
  setters: SessionSetters
): void {
  const { setQueue, setCurrentSong, songCompletedHandlerRef } = setters;

  socketInstance.on("queue-updated", newQueue => {
    console.log("📝 Queue updated:", newQueue);
    setQueue(newQueue);
  });

  socketInstance.on("song-started", song => {
    console.log("🎵 Song started:", song);
    setCurrentSong(song);
  });

  socketInstance.on("song-ended", data => {
    console.log("🎵 Song ended:", data);
    if (data && typeof data === "object" && data.rating) {
      console.log("Song ended with rating data:", data);
      if (songCompletedHandlerRef.current) {
        songCompletedHandlerRef.current(data);
      }
    } else {
      console.log("Song ended without rating (skip/manual)");
      setCurrentSong(null);
    }
  });
}

function setupPlaybackHandlers(
  socketInstance: Socket,
  setters: SessionSetters
): void {
  const { setPlaybackState } = setters;

  socketInstance.on("playback-state-changed", state => {
    console.log("⏯️ Playback state changed:", state);
    const stateWithOffset = {
      ...state,
      lyricsOffset: state.lyricsOffset ?? 0,
    };
    setPlaybackState(stateWithOffset);
  });

  socketInstance.on("lyrics-sync", data => {
    console.log("🎤 Lyrics sync:", data);
  });
}

function setupUserHandlers(
  socketInstance: Socket,
  setters: SessionSetters
): void {
  const { setSession } = setters;

  socketInstance.on("user-joined", (user: ConnectedUser) => {
    console.log("👤 User joined:", user);
    setSession(prevSession => {
      if (prevSession) {
        return {
          ...prevSession,
          connectedUsers: [...prevSession.connectedUsers, user],
        };
      }
      return prevSession;
    });
  });

  socketInstance.on("user-left", ({ userId }: { userId: string }) => {
    console.log("👋 User left:", userId);
    setSession(prevSession => {
      if (prevSession) {
        return {
          ...prevSession,
          connectedUsers: prevSession.connectedUsers.filter(
            u => u.id !== userId
          ),
        };
      }
      return prevSession;
    });
  });
}

function setupSessionSyncHandlers(
  socketInstance: Socket,
  setters: SessionSetters
): void {
  const { setSession, setQueue, setCurrentSong, setPlaybackState, setError } =
    setters;

  socketInstance.on("session-updated", data => {
    console.log("📡 Session updated:", data);
    if (data.session) setSession(data.session);
    if (data.queue) setQueue(data.queue);
    if (data.currentSong) setCurrentSong(data.currentSong);
    if (data.playbackState) {
      const stateWithOffset = {
        ...data.playbackState,
        lyricsOffset: data.playbackState.lyricsOffset ?? 0,
      };
      setPlaybackState(stateWithOffset);
    }
  });

  socketInstance.on("session-joined", data => {
    console.log("🎉 Session joined successfully:", data);
    if (data.session) setSession(data.session);
    if (data.queue) setQueue(data.queue || data.session?.queue || []);
    if (data.currentSong) setCurrentSong(data.currentSong);
    setError(null);
  });
}

export function setupSessionHandlers(
  socketInstance: Socket,
  setters: SessionSetters
): void {
  setupSessionSyncHandlers(socketInstance, setters);
  setupQueueHandlers(socketInstance, setters);
  setupPlaybackHandlers(socketInstance, setters);
  setupUserHandlers(socketInstance, setters);
}

export function setupConnectionHandlers(
  socketInstance: Socket,
  setters: ConnectionSetters,
  options: ConnectionOptions
): void {
  const {
    setIsConnected,
    setError,
    setSession,
    setQueue,
    setCurrentSong,
    setPlaybackState,
  } = setters;
  const {
    userNameRef,
    heartbeatIntervalRef,
    socketRef,
    setupHeartbeat,
    rejoinSession,
    createSocket,
    setupSocketListeners,
  } = options;

  setupConnectHandler(socketInstance, {
    setIsConnected,
    setError,
    setSession,
    setQueue,
    setCurrentSong,
    setPlaybackState,
    userNameRef,
    setupHeartbeat,
    rejoinSession,
  });

  setupDisconnectHandler(socketInstance, {
    setIsConnected,
    setError,
    heartbeatIntervalRef,
    userNameRef,
    socketRef,
    createSocket,
    setupSocketListeners,
  });

  setupReconnectHandlers(socketInstance, {
    setIsConnected,
    setError,
    userNameRef,
    socketRef,
    createSocket,
    setupSocketListeners,
  });
}

interface ConnectHandlerOptions {
  setIsConnected: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setSession: Dispatch<SetStateAction<KaraokeSession | null>>;
  setQueue: Dispatch<SetStateAction<QueueItem[]>>;
  setCurrentSong: Dispatch<SetStateAction<QueueItem | null>>;
  setPlaybackState: Dispatch<SetStateAction<PlaybackState | null>>;
  userNameRef: MutableRefObject<string | null>;
  setupHeartbeat: () => void;
  rejoinSession: () => void;
}

function setupConnectHandler(
  socketInstance: Socket,
  options: ConnectHandlerOptions
): void {
  const {
    setIsConnected,
    setError,
    setSession,
    setQueue,
    setCurrentSong,
    setPlaybackState,
    userNameRef,
    setupHeartbeat,
    rejoinSession,
  } = options;

  socketInstance.on("connect", () => {
    console.log("✅ Connected to WebSocket server with fresh socket");
    setIsConnected(true);
    setError(null);
    setupHeartbeat();

    if (userNameRef.current) {
      console.log("🔄 Auto-rejoining session with fresh connection");
      setSession(null);
      setQueue([]);
      setCurrentSong(null);
      setPlaybackState(null);

      setTimeout(() => {
        rejoinSession();
      }, 500);
    }
  });
}

interface DisconnectHandlerOptions {
  setIsConnected: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  heartbeatIntervalRef: MutableRefObject<NodeJS.Timeout | null>;
  userNameRef: MutableRefObject<string | null>;
  socketRef: MutableRefObject<Socket | null>;
  createSocket: () => Socket;
  setupSocketListeners: (socket: Socket) => void;
}

function setupDisconnectHandler(
  socketInstance: Socket,
  options: DisconnectHandlerOptions
): void {
  const {
    setIsConnected,
    setError,
    heartbeatIntervalRef,
    userNameRef,
    socketRef,
    createSocket,
    setupSocketListeners,
  } = options;

  socketInstance.on("disconnect", reason => {
    console.log("❌ Disconnected from WebSocket server:", reason);
    setIsConnected(false);

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (reason === "io server disconnect") {
      setError("Server disconnected the connection");
    } else if (reason === "transport close" || reason === "transport error") {
      setError("Connection lost - creating fresh connection...");
      handleTransportDisconnect(
        socketInstance,
        userNameRef,
        socketRef,
        createSocket,
        setupSocketListeners
      );
    } else {
      setError("Disconnected - attempting to reconnect...");
    }
  });
}

function handleTransportDisconnect(
  socketInstance: Socket,
  userNameRef: MutableRefObject<string | null>,
  socketRef: MutableRefObject<Socket | null>,
  createSocket: () => Socket,
  setupSocketListeners: (socket: Socket) => void
): void {
  setTimeout(() => {
    if (userNameRef.current) {
      console.log("🔄 Creating fresh socket connection...");
      socketInstance.removeAllListeners();
      socketInstance.disconnect();

      const newSocket = createSocket();
      socketRef.current = newSocket;
      setupSocketListeners(newSocket);
      newSocket.connect();
    }
  }, 2000);
}

interface ReconnectHandlerOptions {
  setIsConnected: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  userNameRef: MutableRefObject<string | null>;
  socketRef: MutableRefObject<Socket | null>;
  createSocket: () => Socket;
  setupSocketListeners: (socket: Socket) => void;
}

function setupReconnectHandlers(
  socketInstance: Socket,
  options: ReconnectHandlerOptions
): void {
  const {
    setIsConnected,
    setError,
    userNameRef,
    socketRef,
    createSocket,
    setupSocketListeners,
  } = options;

  socketInstance.on("connect_error", err => {
    console.error("❌ WebSocket connection error:", err);
    setError("Connection failed: " + (err.message || "Unknown error"));
    setIsConnected(false);
  });

  socketInstance.on("reconnect", (attemptNumber: number) => {
    console.log(`✅ WebSocket reconnected after ${attemptNumber} attempts`);
    console.log(`✅ New socket ID after reconnect:`, socketInstance.id);
    console.log(`✅ Will auto-rejoin as:`, userNameRef.current);
    setError(null);
  });

  socketInstance.on("reconnect_attempt", (attemptNumber: number) => {
    console.log(`🔄 WebSocket reconnection attempt ${attemptNumber}`);
    setError(`Reconnecting... (attempt ${attemptNumber})`);
  });

  socketInstance.on("reconnect_failed", () => {
    console.error(
      "❌ WebSocket reconnection failed, creating fresh connection..."
    );
    handleReconnectFailed(
      socketInstance,
      userNameRef,
      socketRef,
      createSocket,
      setupSocketListeners,
      setError
    );
  });
}

function handleReconnectFailed(
  socketInstance: Socket,
  userNameRef: MutableRefObject<string | null>,
  socketRef: MutableRefObject<Socket | null>,
  createSocket: () => Socket,
  setupSocketListeners: (socket: Socket) => void,
  setError: Dispatch<SetStateAction<string | null>>
): void {
  if (userNameRef.current) {
    setTimeout(() => {
      console.log("🔄 Creating fresh socket after reconnect failure...");
      socketInstance.removeAllListeners();
      socketInstance.disconnect();

      const newSocket = createSocket();
      socketRef.current = newSocket;
      setupSocketListeners(newSocket);
      newSocket.connect();
    }, 3000);
  } else {
    setError("Failed to reconnect. Please refresh the page.");
  }
}

export function setupErrorHandler(
  socketInstance: Socket,
  setters: Pick<ConnectionSetters, "setError">,
  options: Pick<
    ConnectionOptions,
    | "userNameRef"
    | "reconnectTimeoutRef"
    | "socketRef"
    | "createSocket"
    | "setupSocketListeners"
  >
): void {
  const { setError } = setters;
  const {
    userNameRef,
    reconnectTimeoutRef,
    socketRef,
    createSocket,
    setupSocketListeners,
  } = options;

  socketInstance.on(
    "error",
    (errorData: { code?: string; message?: string }) => {
      console.error("❌ WebSocket error:", errorData);

      if (errorData.code === "NOT_IN_SESSION" && userNameRef.current) {
        handleSessionLostError(
          socketInstance,
          setError,
          reconnectTimeoutRef,
          socketRef,
          createSocket,
          setupSocketListeners
        );
      } else {
        setError(errorData.message || "An error occurred");
      }
    }
  );
}

function handleSessionLostError(
  socketInstance: Socket,
  setError: Dispatch<SetStateAction<string | null>>,
  reconnectTimeoutRef: MutableRefObject<NodeJS.Timeout | null>,
  socketRef: MutableRefObject<Socket | null>,
  createSocket: () => Socket,
  setupSocketListeners: (socket: Socket) => void
): void {
  console.log("🔄 Session lost, creating fresh connection...");
  setError("Session lost - reconnecting with fresh connection...");

  if (reconnectTimeoutRef.current) {
    clearTimeout(reconnectTimeoutRef.current);
  }

  reconnectTimeoutRef.current = setTimeout(() => {
    console.log("🔄 Creating fresh socket due to session loss...");
    socketInstance.removeAllListeners();
    socketInstance.disconnect();

    const newSocket = createSocket();
    socketRef.current = newSocket;
    setupSocketListeners(newSocket);
    newSocket.connect();
  }, 2000);
}
