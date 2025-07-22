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

  // Persistent reconnection state
  const userNameRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string>("main-session");
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-rejoin session after reconnection
  const rejoinSession = useCallback(() => {
    if (socketRef.current?.connected && userNameRef.current) {
      console.log("🔄 Auto-rejoining session:", userNameRef.current);
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
  const createSocket = useCallback(() => {
    return io({
      autoConnect: false,
      reconnectionAttempts: 5, // Reduced attempts since we'll create fresh connections
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true, // Always create a fresh connection
      query: {
        client:
          typeof window !== "undefined" && window.location.pathname === "/tv"
            ? "tv"
            : "mobile",
      },
    });
  }, []);

  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;

    const setupSocketListeners = (socketInstance: Socket) => {
      // Connection event handlers
      socketInstance.on("connect", () => {
        console.log("✅ Connected to WebSocket server with fresh socket");
        setIsConnected(true);
        setError(null);
        setupHeartbeat();

        // Auto-rejoin session after reconnection with fresh socket
        if (userNameRef.current) {
          console.log("🔄 Auto-rejoining session with fresh connection");
          // Clear local session state to force a clean rejoin
          setSession(null);
          setQueue([]);
          setCurrentSong(null);
          setPlaybackState(null);
          
          // Rejoin after a small delay to ensure server is ready
          setTimeout(() => {
            rejoinSession();
          }, 500);
        }
      });

      socketInstance.on("disconnect", (reason) => {
        console.log("❌ Disconnected from WebSocket server:", reason);
        setIsConnected(false);
        
        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // Set appropriate error message
        if (reason === "io server disconnect") {
          setError("Server disconnected the connection");
        } else if (reason === "transport close" || reason === "transport error") {
          setError("Connection lost - creating fresh connection...");
          
          // Create a fresh socket connection after a delay
          setTimeout(() => {
            if (userNameRef.current) {
              console.log("🔄 Creating fresh socket connection...");
              
              // Disconnect old socket completely
              socketInstance.removeAllListeners();
              socketInstance.disconnect();
              
              // Create fresh socket
              const newSocket = createSocket();
              socketRef.current = newSocket;
              setupSocketListeners(newSocket);
              newSocket.connect();
            }
          }, 2000);
        } else {
          setError("Disconnected - attempting to reconnect...");
        }
      });

      socketInstance.on("connect_error", (err) => {
        console.error("❌ WebSocket connection error:", err);
        setError("Connection failed: " + (err.message || "Unknown error"));
        setIsConnected(false);
      });

      socketInstance.on("reconnect", (attemptNumber) => {
        console.log(`✅ WebSocket reconnected after ${attemptNumber} attempts`);
        setError(null);
      });

      socketInstance.on("reconnect_attempt", (attemptNumber) => {
        console.log(`🔄 WebSocket reconnection attempt ${attemptNumber}`);
        setError(`Reconnecting... (attempt ${attemptNumber})`);
      });

      socketInstance.on("reconnect_failed", () => {
        console.error("❌ WebSocket reconnection failed, creating fresh connection...");
        
        // Create a completely fresh connection
        if (userNameRef.current) {
          setTimeout(() => {
            console.log("🔄 Creating fresh socket after reconnect failure...");
            
            // Disconnect old socket completely
            socketInstance.removeAllListeners();
            socketInstance.disconnect();
            
            // Create fresh socket
            const newSocket = createSocket();
            socketRef.current = newSocket;
            setupSocketListeners(newSocket);
            newSocket.connect();
          }, 3000);
        } else {
          setError("Failed to reconnect. Please refresh the page.");
        }
      });

      // Session event handlers
      socketInstance.on("session-updated", (data) => {
        console.log("📡 Session updated:", data);
        if (data.session) setSession(data.session);
        if (data.queue) setQueue(data.queue);
        if (data.currentSong) setCurrentSong(data.currentSong);
        if (data.playbackState) setPlaybackState(data.playbackState);
      });

      socketInstance.on("session-joined", (data) => {
        console.log("🎉 Session joined successfully:", data);
        if (data.session) setSession(data.session);
        if (data.queue) setQueue(data.queue || data.session?.queue || []);
        if (data.currentSong) setCurrentSong(data.currentSong);
        
        // Clear any error messages on successful join
        setError(null);
      });

      socketInstance.on("queue-updated", (newQueue) => {
        console.log("📝 Queue updated:", newQueue);
        setQueue(newQueue);
      });

      socketInstance.on("song-started", (song) => {
        console.log("🎵 Song started:", song);
        setCurrentSong(song);
      });

      socketInstance.on("song-ended", (data) => {
        console.log("🎵 Song ended:", data);

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

      socketInstance.on("user-joined", (user) => {
        console.log("👤 User joined:", user);
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

      socketInstance.on("user-left", ({ userId }) => {
        console.log("👋 User left:", userId);
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

      socketInstance.on("playback-state-changed", (state) => {
        console.log("⏯️ Playback state changed:", state);
        setPlaybackState(state);
      });

      socketInstance.on("lyrics-sync", (data) => {
        console.log("🎤 Lyrics sync:", data);
        // Handle lyrics synchronization
      });

      socketInstance.on("error", (errorData) => {
        console.error("❌ WebSocket error:", errorData);

        // Handle "not in session" errors by creating fresh connection
        if (errorData.code === "NOT_IN_SESSION" && userNameRef.current) {
          console.log("🔄 Session lost, creating fresh connection...");
          setError("Session lost - reconnecting with fresh connection...");

          // Clear any existing timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }

          // Create fresh connection after a delay
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("🔄 Creating fresh socket due to session loss...");
            
            // Disconnect old socket completely
            socketInstance.removeAllListeners();
            socketInstance.disconnect();
            
            // Create fresh socket
            const newSocket = createSocket();
            socketRef.current = newSocket;
            setupSocketListeners(newSocket);
            newSocket.connect();
          }, 2000);
        } else {
          setError(errorData.message || "An error occurred");
        }
      });
    };

    // Setup listeners for initial socket
    setupSocketListeners(socket);

    // Handle page visibility changes (mobile browser backgrounding)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("📱 Page became visible, checking connection...");

        // Small delay to allow socket to reconnect if needed
        setTimeout(() => {
          const currentSocket = socketRef.current;
          if (!currentSocket?.connected && userNameRef.current) {
            console.log("🔄 Socket not connected, creating fresh connection...");
            
            // Create completely fresh connection
            if (currentSocket) {
              currentSocket.removeAllListeners();
              currentSocket.disconnect();
            }
            
            const newSocket = createSocket();
            socketRef.current = newSocket;
            setupSocketListeners(newSocket);
            newSocket.connect();
          } else if (currentSocket?.connected && userNameRef.current && !session) {
            console.log("🔄 Connected but no session, rejoining...");
            rejoinSession();
          }
        }, 1000);
      }
    };

    // Handle online/offline events
    const handleOnline = () => {
      console.log("🌐 Network back online, creating fresh connection...");
      const currentSocket = socketRef.current;
      
      if (userNameRef.current) {
        // Always create fresh connection when coming back online
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

    // Add event listeners
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    // Connect initial socket to server
    socket.connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }

      // Clean up current socket
      const currentSocket = socketRef.current;
      if (currentSocket) {
        currentSocket.removeAllListeners();
        currentSocket.disconnect();
      }
    };
  }, [rejoinSession, setupHeartbeat, createSocket]); // Add dependencies

  // Send heartbeat every 30 seconds - removed this useEffect since we handle it in setupHeartbeat

  // WebSocket action functions (memoized to prevent infinite loops)
  const joinSession = useCallback((sessionId: string, userName: string) => {
    if (socketRef.current) {
      console.log("🚀 Joining session:", sessionId, "as", userName);
      userNameRef.current = userName; // Store username for auto-rejoin
      sessionIdRef.current = sessionId; // Store session ID
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
        } else if (userNameRef.current && socketRef.current) {
          // If not connected, show a more helpful error
          setError("Connection lost. Attempting to reconnect...");

          // Try to reconnect and rejoin
          socketRef.current.connect();

          // Reject with a helpful error message
          reject(
            new Error(
              "Connection lost. Please wait for reconnection or refresh the page.",
            ),
          );
        } else {
          reject(
            new Error("Not connected to server. Please refresh the page."),
          );
        }
      });
    },
    [],
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
