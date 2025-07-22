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
  addSong: (mediaItem: MediaItem, position?: number) => Promise<void>;
  removeSong: (queueItemId: string) => void;
  reorderQueue: (queueItemId: string, newPosition: number) => void;
  playbackControl: (command: PlaybackCommand) => void;
  skipSong: () => void;
  songEnded: () => void;
  startNextSong: () => void;
  updateLocalPlaybackState: (updates: Partial<PlaybackState>) => void;
  setSongCompletedHandler: (
    handler: (data: { song: QueueItem; rating: any }) => void,
  ) => void;
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
  const songCompletedHandlerRef = useRef<
    ((data: { song: QueueItem; rating: any }) => void) | null
  >(null);

  // Track reconnection state
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastUserName, setLastUserName] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socket = io({
      autoConnect: false,
      reconnectionAttempts: 10, // Increased attempts
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

      // Auto-rejoin session after reconnection
      if (isReconnecting && lastUserName) {
        console.log("Auto-rejoining session after reconnection:", lastUserName);
        socket.emit("join-session", {
          sessionId: "main-session",
          userName: lastUserName,
        });
        setIsReconnecting(false);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("Disconnected from WebSocket server:", reason);
      setIsConnected(false);

      // Mark as reconnecting if it wasn't a manual disconnect
      if (reason !== "io client disconnect") {
        setIsReconnecting(true);
        console.log("Will attempt to rejoin session on reconnection");
      }
    });

    socket.on("connect_error", (err) => {
      console.error("WebSocket connection error:", err);
      setError(
        "Failed to connect to server: " + (err.message || "Unknown error"),
      );
      setIsConnected(false);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
      setError(null);
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`WebSocket reconnection attempt ${attemptNumber}`);
      setError(`Reconnecting... (attempt ${attemptNumber})`);
    });

    socket.on("reconnect_failed", () => {
      console.error("WebSocket reconnection failed");
      setError("Failed to reconnect to server after multiple attempts");
      setIsReconnecting(false);
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

    socket.on("song-ended", (data) => {
      console.log("Song ended:", data);

      if (data && typeof data === "object" && data.rating) {
        // This is a completion with rating data - trigger transitions
        console.log("Song ended with rating data:", data);
        if (songCompletedHandlerRef.current) {
          songCompletedHandlerRef.current(data);
        }
      } else {
        // This is a simple song end (skip, etc.) - just clear current song
        console.log("Song ended without rating (skip/manual)");
        setCurrentSong(null);
      }
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

      // Handle "not in session" errors with auto-retry
      if (errorData.code === "NOT_IN_SESSION" && lastUserName) {
        console.log("Session lost, attempting to rejoin...");
        setError("Reconnecting to session...");

        // Clear any existing timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        // Retry joining session after a short delay
        reconnectTimeoutRef.current = setTimeout(() => {
          if (socketRef.current?.connected) {
            console.log("Retrying session join for:", lastUserName);
            socketRef.current.emit("join-session", {
              sessionId: "main-session",
              userName: lastUserName,
            });
          }
        }, 1000);
      } else {
        setError(errorData.message);
      }
    });

    // Connect to server
    socket.connect();

    // Handle page visibility changes (mobile browser backgrounding)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && lastUserName) {
        console.log("Page became visible, checking connection...");

        // Small delay to allow socket to reconnect if needed
        setTimeout(() => {
          if (socket.connected && lastUserName) {
            // Test connection by sending a heartbeat
            socket.emit("user-heartbeat");

            // If we don't have a session, rejoin
            if (!session) {
              console.log(
                "No session found after becoming visible, rejoining...",
              );
              socket.emit("join-session", {
                sessionId: "main-session",
                userName: lastUserName,
              });
            }
          } else if (!socket.connected) {
            console.log(
              "Socket not connected after becoming visible, reconnecting...",
            );
            socket.connect();
          }
        }, 500);
      }
    };

    // Add visibility change listener for mobile browser handling
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (typeof document !== "undefined") {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
      }

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
      console.log("Joining session:", sessionId, "as", userName);
      setLastUserName(userName); // Track username for auto-rejoin
      socketRef.current.emit("join-session", { sessionId, userName });
    }
  }, []);

  const addSong = useCallback(
    (mediaItem: MediaItem, position?: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (socketRef.current?.connected) {
          // Set up one-time listeners for this specific add-song operation
          const handleError = (error: { code: string; message: string }) => {
            if (
              error.code === "NOT_IN_SESSION" ||
              error.code === "ADD_SONG_FAILED"
            ) {
              socketRef.current?.off("error", handleError);
              socketRef.current?.off("queue-updated", handleSuccess);
              reject(new Error(error.message));
            }
          };

          const handleSuccess = () => {
            socketRef.current?.off("error", handleError);
            socketRef.current?.off("queue-updated", handleSuccess);
            resolve();
          };

          // Listen for error and success events
          socketRef.current.on("error", handleError);
          socketRef.current.on("queue-updated", handleSuccess);

          // Emit the add-song event
          socketRef.current.emit("add-song", { mediaItem, position });
        } else if (lastUserName && socketRef.current) {
          // If not connected, show a more helpful error
          setError("Connection lost. Attempting to reconnect...");

          // Try to reconnect and rejoin
          socketRef.current.connect();

          // Reject with a helpful error message
          reject(
            new Error(
              "Connection lost. Please refresh the page and try again.",
            ),
          );
        } else {
          reject(
            new Error("Not connected to server. Please refresh the page."),
          );
        }
      });
    },
    [lastUserName],
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

  const setSongCompletedHandler = useCallback(
    (handler: (data: { song: QueueItem; rating: any }) => void) => {
      songCompletedHandlerRef.current = handler;
    },
    [],
  );

  const startNextSong = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("start-next-song");
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
