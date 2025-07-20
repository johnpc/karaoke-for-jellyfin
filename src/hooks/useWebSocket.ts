// React hook for WebSocket connection
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
  MediaItem,
  QueueItem,
  ConnectedUser,
  PlaybackState,
  KaraokeSession,
  PlaybackCommand,
} from "@/types";

interface WebSocketHookReturn {
  socket: Socket | null;
  isConnected: boolean;
  joinSession: (sessionId: string, userName: string) => void;
  addSong: (mediaItem: MediaItem, position?: number) => void;
  removeSong: (queueItemId: string) => void;
  reorderQueue: (queueItemId: string, newPosition: number) => void;
  playbackControl: (command: PlaybackCommand) => void;
  skipSong: () => void;
  songEnded: () => void;
  updateLocalPlaybackState: (updates: Partial<PlaybackState>) => void;
  session: KaraokeSession | null;
  queue: QueueItem[];
  currentSong: QueueItem | null;
  playbackState: PlaybackState | null;
  error: string | null;
}

export function useWebSocket(): WebSocketHookReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [session, setSession] = useState<KaraokeSession | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentSong, setCurrentSong] = useState<QueueItem | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socket = io({
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      query: {
        client:
          typeof window !== "undefined" && window.location.pathname === "/tv"
            ? "tv"
            : "mobile",
      },
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
      setIsConnected(true);
      setError(null);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("WebSocket connection error:", err);
      setError(
        "Failed to connect to server: " + (err.message || "Unknown error"),
      );
      setIsConnected(false);
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`WebSocket reconnection attempt ${attemptNumber}`);
    });

    socket.on("reconnect_failed", () => {
      console.error("WebSocket reconnection failed");
      setError("Failed to reconnect to server after multiple attempts");
    });

    // Session event handlers
    socket.on("session-updated", (data) => {
      console.log("Session updated:", data);
      if (data.session) setSession(data.session);
      if (data.queue) setQueue(data.queue);
      if (data.currentSong) setCurrentSong(data.currentSong);
      if (data.playbackState) setPlaybackState(data.playbackState);
    });

    socket.on("session-joined", (data) => {
      console.log("Session joined:", data);
      if (data.session) setSession(data.session);
      if (data.queue) setQueue(data.queue || data.session?.queue || []);
      if (data.currentSong) setCurrentSong(data.currentSong);
    });

    socket.on("queue-updated", (newQueue) => {
      console.log("Queue updated:", newQueue);
      setQueue(newQueue);
    });

    socket.on("song-started", (song) => {
      console.log("Song started:", song);
      setCurrentSong(song);
    });

    socket.on("song-ended", (song) => {
      console.log("Song ended:", song);
      setCurrentSong(null);
    });

    socket.on("user-joined", (user) => {
      console.log("User joined:", user);
      // Update session users if we have the session
      setSession((prevSession) => {
        if (prevSession) {
          return {
            ...prevSession,
            connectedUsers: [...prevSession.connectedUsers, user],
          };
        }
        return prevSession;
      });
    });

    socket.on("user-left", ({ userId }) => {
      console.log("User left:", userId);
      // Update session users if we have the session
      setSession((prevSession) => {
        if (prevSession) {
          return {
            ...prevSession,
            connectedUsers: prevSession.connectedUsers.filter(
              (u) => u.id !== userId,
            ),
          };
        }
        return prevSession;
      });
    });

    socket.on("playback-state-changed", (state) => {
      console.log("Playback state changed:", state);
      setPlaybackState(state);
    });

    socket.on("lyrics-sync", (data) => {
      console.log("Lyrics sync:", data);
      // Handle lyrics synchronization
    });

    socket.on("error", (errorData) => {
      console.error("WebSocket error:", errorData);
      setError(errorData.message);
    });

    // Connect to server
    socket.connect();

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []); // Remove session dependency to prevent infinite reconnection

  // Send heartbeat every 30 seconds
  useEffect(() => {
    if (!isConnected || !socketRef.current) return;

    const heartbeatInterval = setInterval(() => {
      socketRef.current?.emit("user-heartbeat");
    }, 30000);

    return () => clearInterval(heartbeatInterval);
  }, [isConnected]);

  // WebSocket action functions (memoized to prevent infinite loops)
  const joinSession = useCallback((sessionId: string, userName: string) => {
    if (socketRef.current) {
      socketRef.current.emit("join-session", { sessionId, userName });
    }
  }, []);

  const addSong = useCallback((mediaItem: MediaItem, position?: number) => {
    if (socketRef.current) {
      socketRef.current.emit("add-song", { mediaItem, position });
    }
  }, []);

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
    [],
  );

  const playbackControl = useCallback((command: PlaybackCommand) => {
    console.log("Sending playback control command:", command);
    if (socketRef.current) {
      console.log("Socket is available, emitting playback-control");
      socketRef.current.emit("playback-control", command);
    } else {
      console.log("Socket is not available!");
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

  const updateLocalPlaybackState = useCallback(
    (updates: Partial<PlaybackState>) => {
      setPlaybackState((prevState) => {
        if (!prevState) {
          // If no previous state, create a new one with defaults
          return {
            isPlaying: false,
            currentTime: 0,
            volume: 80,
            isMuted: false,
            playbackRate: 1.0,
            ...updates,
          };
        }
        // Merge updates with existing state
        return {
          ...prevState,
          ...updates,
        };
      });
    },
    [],
  );

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
    updateLocalPlaybackState,
    session,
    queue,
    currentSong,
    playbackState,
    error,
  };
}
