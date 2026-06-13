"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Socket } from "socket.io-client";
import {
  MediaItem,
  QueueItem,
  PlaybackState,
  KaraokeSession,
  PlaybackCommand,
} from "@/types";
import {
  setupSessionHandlers,
  setupConnectionHandlers,
  setupErrorHandler,
} from "./socketHandlers";
import {
  createSocketFactory,
  getClientType,
  createVisibilityHandler,
  createNetworkHandlers,
} from "./connectionManager";

interface WebSocketHookReturn {
  socket: Socket | null;
  isConnected: boolean;
  joinSession: (sessionId: string, userName: string) => void;
  addSong: (mediaItem: MediaItem, position?: number) => Promise<void>;
  removeSong: (queueItemId: string) => void;
  reorderQueue: (queueItemId: string, newPosition: number) => void;
  playbackControl: (command: PlaybackCommand) => void;
  skipSong: () => void;
  songEnded: () => void;
  startNextSong: () => void;
  updateLocalPlaybackState: (updates: Partial<PlaybackState>) => void;
  setSongCompletedHandler: (
    handler: (data: { song: QueueItem; rating: unknown }) => void
  ) => void;
  session: KaraokeSession | null;
  queue: QueueItem[];
  currentSong: QueueItem | null;
  playbackState: PlaybackState | null;
  error: string | null;
}

interface AddSongDeps {
  socketRef: React.MutableRefObject<Socket | null>;
  userNameRef: React.MutableRefObject<string | null>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

function handleAddSongConnected(
  socket: Socket,
  mediaItem: MediaItem,
  position: number | undefined,
  resolve: () => void,
  reject: (error: Error) => void
): void {
  const handleError = (error: { code: string; message: string }) => {
    if (error.code === "NOT_IN_SESSION" || error.code === "ADD_SONG_FAILED") {
      socket.off("error", handleError);
      socket.off("queue-updated", handleSuccess);
      reject(new Error(error.message));
    }
  };

  const handleSuccess = () => {
    socket.off("error", handleError);
    socket.off("queue-updated", handleSuccess);
    resolve();
  };

  socket.on("error", handleError);
  socket.on("queue-updated", handleSuccess);
  socket.emit("add-song", { mediaItem, position });
}

function handleAddSongDisconnected(
  deps: AddSongDeps,
  reject: (error: Error) => void
): void {
  if (deps.userNameRef.current && deps.socketRef.current) {
    deps.setError("Connection lost. Attempting to reconnect...");
    deps.socketRef.current.connect();
    reject(
      new Error(
        "Connection lost. Please wait for reconnection or refresh the page."
      )
    );
  } else {
    reject(new Error("Not connected to server. Please refresh the page."));
  }
}

function addEventListeners(
  handleVisibilityChange: () => void,
  handleOnline: () => void,
  handleOffline: () => void
): void {
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }
  if (typeof window !== "undefined") {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
  }
}

function removeEventListeners(
  handleVisibilityChange: () => void,
  handleOnline: () => void,
  handleOffline: () => void
): void {
  if (typeof document !== "undefined") {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  }
  if (typeof window !== "undefined") {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  }
}

function cleanupTimers(
  reconnectTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
  heartbeatIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>
): void {
  if (reconnectTimeoutRef.current) {
    clearTimeout(reconnectTimeoutRef.current);
  }
  if (heartbeatIntervalRef.current) {
    clearInterval(heartbeatIntervalRef.current);
  }
}

function disconnectSocket(
  socketRef: React.MutableRefObject<Socket | null>
): void {
  const currentSocket = socketRef.current;
  if (currentSocket) {
    currentSocket.removeAllListeners();
    currentSocket.disconnect();
  }
}

interface CypressTestHelpers {
  setQueue: React.Dispatch<React.SetStateAction<QueueItem[]>>;
  setCurrentSong: React.Dispatch<React.SetStateAction<QueueItem | null>>;
  setPlaybackState: React.Dispatch<React.SetStateAction<PlaybackState | null>>;
  setSession: React.Dispatch<React.SetStateAction<KaraokeSession | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

function setupCypressTestHelpers(helpers: CypressTestHelpers): void {
  if (typeof window === "undefined") return;
  if (
    process.env.NODE_ENV !== "development" &&
    !(window as unknown as { Cypress?: boolean }).Cypress
  ) {
    return;
  }

  (window as unknown as Record<string, unknown>).webSocketTestHelpers = {
    setQueue: helpers.setQueue,
    setCurrentSong: helpers.setCurrentSong,
    setPlaybackState: helpers.setPlaybackState,
    setSession: helpers.setSession,
    setError: helpers.setError,
  };
}

export function useWebSocket(): WebSocketHookReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [session, setSession] = useState<KaraokeSession | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentSong, setCurrentSong] = useState<QueueItem | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const songCompletedHandlerRef = useRef<
    ((data: { song: QueueItem; rating: unknown }) => void) | null
  >(null);

  // Persistent reconnection state
  const userNameRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string>("main-session");
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-rejoin session after reconnection
  const rejoinSession = useCallback(() => {
    if (socketRef.current?.connected && userNameRef.current) {
      socketRef.current.emit("join-session", {
        sessionId: sessionIdRef.current,
        userName: userNameRef.current,
      });
    }
  }, []);

  // Setup heartbeat
  const setupHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("user-heartbeat");
      }
    }, 30000);
  }, []);

  // Create socket factory function
  const createSocket = useCallback(createSocketFactory(getClientType()), []);

  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;

    const setupSocketListeners = (socketInstance: Socket) => {
      setupSessionHandlers(socketInstance, {
        setSession,
        setQueue,
        setCurrentSong,
        setPlaybackState,
        setError,
        songCompletedHandlerRef,
      });

      setupConnectionHandlers(
        socketInstance,
        {
          setIsConnected,
          setError,
          setSession,
          setQueue,
          setCurrentSong,
          setPlaybackState,
        },
        {
          userNameRef,
          heartbeatIntervalRef,
          socketRef,
          reconnectTimeoutRef,
          setupHeartbeat,
          rejoinSession,
          createSocket,
          setupSocketListeners,
        }
      );

      setupErrorHandler(
        socketInstance,
        { setError },
        {
          userNameRef,
          reconnectTimeoutRef,
          socketRef,
          createSocket,
          setupSocketListeners,
        }
      );
    };

    setupSocketListeners(socket);

    const handleVisibilityChange = createVisibilityHandler({
      socketRef,
      userNameRef,
      createSocket,
      setupSocketListeners,
      rejoinSession,
      hasSession: !!session,
    });

    const { handleOnline, handleOffline } = createNetworkHandlers({
      socketRef,
      userNameRef,
      createSocket,
      setupSocketListeners,
      setError,
    });

    addEventListeners(handleVisibilityChange, handleOnline, handleOffline);
    socket.connect();

    return () => {
      cleanupTimers(reconnectTimeoutRef, heartbeatIntervalRef);
      removeEventListeners(handleVisibilityChange, handleOnline, handleOffline);
      disconnectSocket(socketRef);
    };
  }, [rejoinSession, setupHeartbeat, createSocket]);

  // WebSocket action functions
  const joinSession = useCallback((sessionId: string, userName: string) => {
    if (socketRef.current) {
      userNameRef.current = userName;
      sessionIdRef.current = sessionId;
      socketRef.current.emit("join-session", { sessionId, userName });
    }
  }, []);

  const addSong = useCallback(
    (mediaItem: MediaItem, position?: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (socketRef.current?.connected) {
          handleAddSongConnected(
            socketRef.current,
            mediaItem,
            position,
            resolve,
            reject
          );
        } else {
          handleAddSongDisconnected(
            { socketRef, userNameRef, setError },
            reject
          );
        }
      });
    },
    []
  );

  const removeSong = useCallback((queueItemId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("remove-song", { queueItemId });
    }
  }, []);

  const reorderQueue = useCallback(
    (queueItemId: string, newPosition: number) => {
      if (socketRef.current) {
        socketRef.current.emit("reorder-queue", { queueItemId, newPosition });
      }
    },
    []
  );

  const playbackControl = useCallback((command: PlaybackCommand) => {
    if (socketRef.current) {
      socketRef.current.emit("playback-control", command);
    }
  }, []);

  const skipSong = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("skip-song");
    }
  }, []);

  const songEnded = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("song-ended");
    }
  }, []);

  const setSongCompletedHandler = useCallback(
    (handler: (data: { song: QueueItem; rating: unknown }) => void) => {
      songCompletedHandlerRef.current = handler;
    },
    []
  );

  const startNextSong = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("start-next-song");
    }
  }, []);

  const updateLocalPlaybackState = useCallback(
    (updates: Partial<PlaybackState>) => {
      setPlaybackState(prevState => {
        if (!prevState) {
          return {
            isPlaying: false,
            currentTime: 0,
            volume: 80,
            isMuted: false,
            playbackRate: 1.0,
            lyricsOffset: 0,
            ...updates,
          };
        }
        return { ...prevState, ...updates };
      });
    },
    []
  );

  // Expose state setters for Cypress testing
  useEffect(() => {
    setupCypressTestHelpers({
      setQueue,
      setCurrentSong,
      setPlaybackState,
      setSession,
      setError,
    });
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    joinSession,
    addSong,
    removeSong,
    reorderQueue,
    playbackControl,
    skipSong,
    songEnded,
    startNextSong,
    updateLocalPlaybackState,
    setSongCompletedHandler,
    session,
    queue,
    currentSong,
    playbackState,
    error,
  };
}
