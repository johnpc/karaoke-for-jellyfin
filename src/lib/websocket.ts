// WebSocket server setup for real-time communication
import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { getSessionManager } from "@/services/session";
import {
  WebSocketMessage,
  PlaybackCommand,
  MediaItem,
  WebSocketMessageType,
} from "@/types";

let io: SocketIOServer | undefined;

interface ClientToServerEvents {
  "join-session": (data: { sessionId: string; userName: string }) => void;
  "add-song": (data: { mediaItem: MediaItem; position?: number }) => void;
  "remove-song": (data: { queueItemId: string }) => void;
  "reorder-queue": (data: { queueItemId: string; newPosition: number }) => void;
  "playback-control": (command: PlaybackCommand) => void;
  "skip-song": () => void;
  "user-heartbeat": () => void;
  "lyrics-sync": (data: { songId: string; currentTime: number }) => void;
}

interface ServerToClientEvents {
  "session-updated": (session: any) => void;
  "queue-updated": (queue: any[]) => void;
  "song-started": (song: any) => void;
  "song-ended": (song: any) => void;
  "user-joined": (user: any) => void;
  "user-left": (data: { userId: string }) => void;
  "playback-state-changed": (state: any) => void;
  error: (error: { code: string; message: string }) => void;
  "lyrics-sync": (data: { currentLine: number; timestamp: number }) => void;
}

export const initializeWebSocket = (server: HTTPServer) => {
  if (!io) {
    io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
      server,
      {
        cors: {
          origin:
            process.env.NODE_ENV === "development"
              ? ["http://localhost:3000", "http://localhost:3003"]
              : false,
          methods: ["GET", "POST"],
        },
      },
    );

    const sessionManager = getSessionManager();

    // Set up session manager event listeners
    setupSessionEventListeners(sessionManager);

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      let currentUserId: string | null = null;
      let currentSessionId: string | null = null;

      // Handle joining a session
      socket.on("join-session", ({ sessionId, userName }) => {
        try {
          console.log(
            `Client ${socket.id} attempting to join session with name: ${userName}`,
          );

          // Get or create session
          let session = sessionManager.getSession();
          if (!session) {
            // Create new session if none exists
            session = sessionManager.createSession("Karaoke Session", userName);
            currentUserId = session.connectedUsers[0].id;
          } else {
            // Add user to existing session
            const user = sessionManager.addUser(userName, socket.id);
            currentUserId = user.id;
          }

          currentSessionId = session.id;
          socket.join(sessionId);

          // Update user's socket ID
          if (currentUserId) {
            sessionManager.updateUserSocketId(currentUserId, socket.id);
          }

          // Send current session state to the new client
          socket.emit("session-updated", {
            session: sessionManager.getSession(),
            queue: sessionManager.getQueue(),
            currentSong: sessionManager.getCurrentSong(),
            playbackState: sessionManager.getPlaybackState(),
          });

          console.log(
            `Client ${socket.id} joined session ${sessionId} as user ${userName}`,
          );
        } catch (error) {
          console.error("Error joining session:", error);
          socket.emit("error", {
            code: "JOIN_SESSION_FAILED",
            message:
              error instanceof Error ? error.message : "Failed to join session",
          });
        }
      });

      // Handle adding songs to queue
      socket.on("add-song", ({ mediaItem, position }) => {
        if (!currentUserId) {
          socket.emit("error", {
            code: "NOT_IN_SESSION",
            message: "You must join a session first",
          });
          return;
        }

        try {
          const result = sessionManager.addSongToQueue(
            mediaItem,
            currentUserId,
            position,
          );
          if (!result.success) {
            socket.emit("error", {
              code: "ADD_SONG_FAILED",
              message: result.message,
            });
          }
        } catch (error) {
          console.error("Error adding song:", error);
          socket.emit("error", {
            code: "ADD_SONG_FAILED",
            message:
              error instanceof Error ? error.message : "Failed to add song",
          });
        }
      });

      // Handle removing songs from queue
      socket.on("remove-song", ({ queueItemId }) => {
        if (!currentUserId) {
          socket.emit("error", {
            code: "NOT_IN_SESSION",
            message: "You must join a session first",
          });
          return;
        }

        try {
          const result = sessionManager.removeSongFromQueue(
            queueItemId,
            currentUserId,
          );
          if (!result.success) {
            socket.emit("error", {
              code: "REMOVE_SONG_FAILED",
              message: result.message,
            });
          }
        } catch (error) {
          console.error("Error removing song:", error);
          socket.emit("error", {
            code: "REMOVE_SONG_FAILED",
            message:
              error instanceof Error ? error.message : "Failed to remove song",
          });
        }
      });

      // Handle queue reordering
      socket.on("reorder-queue", ({ queueItemId, newPosition }) => {
        if (!currentUserId) {
          socket.emit("error", {
            code: "NOT_IN_SESSION",
            message: "You must join a session first",
          });
          return;
        }

        try {
          const result = sessionManager.reorderQueue(
            queueItemId,
            newPosition,
            currentUserId,
          );
          if (!result.success) {
            socket.emit("error", {
              code: "REORDER_FAILED",
              message: result.message,
            });
          }
        } catch (error) {
          console.error("Error reordering queue:", error);
          socket.emit("error", {
            code: "REORDER_FAILED",
            message:
              error instanceof Error
                ? error.message
                : "Failed to reorder queue",
          });
        }
      });

      // Handle playback controls
      socket.on("playback-control", (command) => {
        if (!currentUserId) {
          socket.emit("error", {
            code: "NOT_IN_SESSION",
            message: "You must join a session first",
          });
          return;
        }

        try {
          console.log("Processing playback command:", command);
          console.log("Action type:", typeof command.action);
          console.log("Action value:", JSON.stringify(command.action));
          console.log("Action === 'lyrics-offset':", command.action === "lyrics-offset");
          
          switch (command.action) {
            case "lyrics-offset":
              console.log("Processing lyrics-offset command:", command);
              if (command.value !== undefined) {
                // Clamp the offset between -10 and +10 seconds
                const clampedOffset = Math.max(-10, Math.min(10, command.value));
                console.log("Setting lyrics offset to:", clampedOffset);
                sessionManager.updatePlaybackState({
                  lyricsOffset: clampedOffset,
                });
                console.log("Updated playback state:", sessionManager.getPlaybackState());
              }
              break;
            case "play":
              const currentSong = sessionManager.getCurrentSong();
              console.log("Current song:", currentSong);
              if (!currentSong) {
                console.log("No current song, starting next song...");
                const nextSong = sessionManager.startNextSong();
                console.log("Started next song:", nextSong);
              } else {
                console.log("Resuming current song");
                sessionManager.updatePlaybackState({ isPlaying: true });
              }
              break;
            case "pause":
              sessionManager.updatePlaybackState({ isPlaying: false });
              break;
            case "volume":
              if (command.value !== undefined) {
                sessionManager.updatePlaybackState({ volume: command.value });
              }
              break;
            case "seek":
              if (command.value !== undefined) {
                sessionManager.updatePlaybackState({
                  currentTime: command.value,
                });
              }
              break;
            case "mute":
              const currentState = sessionManager.getPlaybackState();
              sessionManager.updatePlaybackState({
                isMuted: !currentState?.isMuted,
              });
              break;
            default:
              console.log("Unknown playback action:", command.action);
              break;
          }
        } catch (error) {
          console.error("Error handling playback control:", error);
          socket.emit("error", {
            code: "PLAYBACK_CONTROL_FAILED",
            message:
              error instanceof Error
                ? error.message
                : "Failed to control playback",
          });
        }
      });

      // Handle song skipping
      socket.on("skip-song", () => {
        if (!currentUserId) {
          socket.emit("error", {
            code: "NOT_IN_SESSION",
            message: "You must join a session first",
          });
          return;
        }

        try {
          const result = sessionManager.skipCurrentSong(currentUserId);
          if (!result.success) {
            socket.emit("error", {
              code: "SKIP_FAILED",
              message: result.message,
            });
          }
        } catch (error) {
          console.error("Error skipping song:", error);
          socket.emit("error", {
            code: "SKIP_FAILED",
            message:
              error instanceof Error ? error.message : "Failed to skip song",
          });
        }
      });

      // Handle lyrics synchronization
      socket.on("lyrics-sync", async ({ songId, currentTime }) => {
        if (!currentUserId) {
          socket.emit("error", {
            code: "NOT_IN_SESSION",
            message: "You must join a session first",
          });
          return;
        }

        try {
          // Import lyrics service dynamically to avoid circular dependencies
          const { getLyricsService } = await import("@/services/lyrics");
          const lyricsService = getLyricsService();

          const syncState = lyricsService.updateSyncState(songId, currentTime);

          if (syncState && currentSessionId) {
            // Broadcast lyrics sync to all clients in the session
            io?.to(currentSessionId).emit("lyrics-sync", {
              currentLine: syncState.currentLine,
              timestamp: syncState.currentTimestamp,
              songId,
              syncState,
            });
          }
        } catch (error) {
          console.error("Error syncing lyrics:", error);
          socket.emit("error", {
            code: "LYRICS_SYNC_FAILED",
            message:
              error instanceof Error ? error.message : "Failed to sync lyrics",
          });
        }
      });

      // Handle user heartbeat
      socket.on("user-heartbeat", () => {
        if (currentUserId) {
          sessionManager.updateUserSocketId(currentUserId, socket.id);
        }
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);

        if (currentUserId) {
          try {
            sessionManager.removeUser(currentUserId);
          } catch (error) {
            console.error("Error removing user on disconnect:", error);
          }
        }
      });
    });
  }

  return io;
};

function setupSessionEventListeners(sessionManager: any) {
  // Listen to session manager events and broadcast to clients
  sessionManager.on("session-created", (session: any) => {
    if (io) {
      io.emit("session-updated", session);
    }
  });

  sessionManager.on("user-joined", (user: any) => {
    if (io) {
      io.emit("user-joined", user);
    }
  });

  sessionManager.on("user-left", (data: any) => {
    if (io) {
      io.emit("user-left", data);
    }
  });

  sessionManager.on("queue-updated", (queue: any) => {
    if (io) {
      io.emit("queue-updated", queue);
    }
  });

  sessionManager.on("song-started", (song: any) => {
    if (io) {
      io.emit("song-started", song);
    }
  });

  sessionManager.on("song-ended", (song: any) => {
    if (io) {
      io.emit("song-ended", song);
    }
  });

  sessionManager.on("playback-state-changed", (state: any) => {
    if (io) {
      io.emit("playback-state-changed", state);
    }
  });
}

export const getWebSocketServer = () => {
  if (!io) {
    throw new Error("WebSocket server not initialized");
  }
  return io;
};

export const broadcastToSession = (
  sessionId: string,
  event: string,
  data: any,
) => {
  if (io) {
    io.to(sessionId).emit(event, data);
  }
};

export const broadcastToAll = (event: string, data: unknown) => {
  if (io) {
    io.emit(event, data);
  }
};
