// Custom server for Next.js with WebSocket support
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

// When using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Initialize Socket.IO server
  const io = new Server(server, {
    cors: {
      origin: dev ? ["http://localhost:3000", "http://localhost:3003"] : false,
      methods: ["GET", "POST"],
    },
  });

  // Store for session management (simplified for server.js)
  let sessionManager = null;
  let currentSession = null;
  const connectedUsers = new Map();

  // Basic WebSocket connection handling with session management
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    let currentUserId = null;
    let currentSessionId = null;

    // Auto-join for TV display
    if (socket.handshake.query && socket.handshake.query.client === "tv") {
      const userId = `tv_${Date.now()}`;
      currentUserId = userId;
      currentSessionId = "main-session";
      console.log(`Auto-joining TV client ${userId} to main-session`);

      // Create session if it doesn't exist
      if (!currentSession) {
        currentSession = {
          id: "main-session",
          name: "Karaoke Session",
          queue: [],
          currentSong: null,
          connectedUsers: [],
          createdAt: new Date(),
        };
      }

      // Add TV user to session
      const user = {
        id: userId,
        name: "TV Display",
        socketId: socket.id,
        isHost: true,
        connectedAt: new Date(),
        lastSeen: new Date(),
      };

      currentSession.connectedUsers.push(user);
      connectedUsers.set(socket.id, user);

      // Join the session room
      socket.join("main-session");

      // Notify client
      socket.emit("session-joined", {
        session: currentSession,
        userId: userId,
        queue: currentSession.queue,
        currentSong: currentSession.currentSong,
        playbackState: {
          isPlaying: false,
          currentTime: 0,
          volume: 80,
          isMuted: false,
        },
      });

      console.log("TV client auto-joined to main-session");
    }

    socket.on("join-session", (data) => {
      console.log("Client joining session:", data);
      const { sessionId, userName } = data;

      console.log("Joining socket to room:", sessionId);
      socket.join(sessionId);
      console.log("Socket rooms after join:", Array.from(socket.rooms));

      // Create or join session
      if (!currentSession) {
        console.log("Creating new session:", sessionId);
        currentSession = {
          id: sessionId,
          name: "Karaoke Session",
          queue: [],
          currentSong: null,
          connectedUsers: [],
          createdAt: new Date(),
        };
      } else {
        console.log("Joining existing session:", currentSession.id);
      }

      // Add user to session
      const user = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: userName,
        socketId: socket.id,
        isHost: currentSession.connectedUsers.length === 0,
        connectedAt: new Date(),
      };

      currentSession.connectedUsers.push(user);
      connectedUsers.set(socket.id, user);
      currentUserId = user.id;

      console.log(
        "Session now has",
        currentSession.connectedUsers.length,
        "users",
      );

      // Send session state to client
      socket.emit("session-updated", {
        session: currentSession,
        queue: currentSession.queue,
        currentSong: currentSession.currentSong,
        playbackState: {
          isPlaying: false,
          currentTime: 0,
          volume: 80,
          isMuted: false,
        },
      });

      // Notify other clients
      console.log("Notifying other clients in room:", sessionId);
      socket.to(sessionId).emit("user-joined", user);

      console.log(`User ${userName} joined session ${sessionId}`);
    });

    socket.on("add-song", (data) => {
      console.log("Adding song:", data);

      // Get the user for this socket
      const user = connectedUsers.get(socket.id);
      if (!user) {
        console.log("ERROR: No user found for socket");
        socket.emit("error", {
          code: "NOT_IN_SESSION",
          message: "You must join a session first",
        });
        return;
      }

      // Use the global session (there should only be one)
      if (!currentSession) {
        console.log("ERROR: No current session");
        socket.emit("error", {
          code: "NOT_IN_SESSION",
          message: "No active session",
        });
        return;
      }

      console.log("Current session exists:", !!currentSession);
      console.log("Current user ID:", user.id);
      console.log("Session ID:", currentSession.id);
      console.log(
        "Connected users in session:",
        currentSession.connectedUsers?.length,
      );

      const { mediaItem, position } = data;
      const queueItem = {
        id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        mediaItem,
        addedBy: user.name, // Use user.name instead of user.id
        addedByUserId: user.id, // Keep user ID for reference if needed
        addedAt: new Date(),
        position: position ?? currentSession.queue.length,
        status: "pending",
      };

      if (position !== undefined) {
        currentSession.queue.splice(position, 0, queueItem);
      } else {
        currentSession.queue.push(queueItem);
      }

      // Update positions
      currentSession.queue.forEach((item, index) => {
        item.position = index;
      });

      console.log("Broadcasting queue update to session:", currentSession.id);
      console.log("Queue length:", currentSession.queue.length);
      console.log("Rooms for this socket:", Array.from(socket.rooms));

      // Broadcast queue update to ALL clients in the session room
      console.log("Broadcasting to room:", currentSession.id);
      io.to(currentSession.id).emit("queue-updated", currentSession.queue);

      // Also broadcast to main-session room as backup
      io.to("main-session").emit("queue-updated", currentSession.queue);

      console.log("Song added to queue and broadcast sent");
    });

    socket.on("remove-song", (data) => {
      console.log("Removing song:", data);
      if (!currentSession || !currentUserId) {
        socket.emit("error", {
          code: "NOT_IN_SESSION",
          message: "You must join a session first",
        });
        return;
      }

      const { queueItemId } = data;
      const itemIndex = currentSession.queue.findIndex(
        (item) => item.id === queueItemId,
      );

      if (itemIndex === -1) {
        socket.emit("error", {
          code: "SONG_NOT_FOUND",
          message: "Song not found in queue",
        });
        return;
      }

      const item = currentSession.queue[itemIndex];
      const user = connectedUsers.get(socket.id);

      // Check permissions
      //   if (item.addedBy !== currentUserId && !user?.isHost) {
      //     socket.emit('error', { code: 'UNAUTHORIZED', message: 'You can only remove your own songs' })
      //     return
      //   }

      currentSession.queue.splice(itemIndex, 1);

      // Update positions
      currentSession.queue.forEach((item, index) => {
        item.position = index;
      });

      // Broadcast queue update
      io.to(currentSession.id).emit("queue-updated", currentSession.queue);
      console.log("Song removed from queue");
    });

    socket.on("playback-control", (command) => {
      console.log("Playback control:", command);

      // Get the user for this socket
      const user = connectedUsers.get(socket.id);
      console.log("Current user:", user?.name || "Unknown");
      console.log("Current session exists:", !!currentSession);

      // Allow TV clients or users in session
      if (!user && !currentSession) {
        console.log("No user and no session, must join session first");
        socket.emit("error", {
          code: "NOT_IN_SESSION",
          message: "You must join a session first",
        });
        return;
      }

      if (!currentSession) {
        console.log("No current session");
        socket.emit("error", {
          code: "NOT_IN_SESSION",
          message: "No active session",
        });
        return;
      }

      try {
        switch (command.action) {
          case "play":
            console.log("Processing play command");
            if (!currentSession.currentSong) {
              console.log("No current song, starting next song from queue");
              // Find next pending song
              const nextSong = currentSession.queue.find(
                (item) => item.status === "pending",
              );
              if (nextSong) {
                console.log("Found next song:", nextSong.mediaItem.title);
                // Mark song as playing
                nextSong.status = "playing";
                currentSession.currentSong = nextSong;

                // Initialize playback state for new song
                if (!currentSession.playbackState) {
                  currentSession.playbackState = {
                    isPlaying: true,
                    currentTime: 0,
                    volume: 80,
                    isMuted: false,
                    playbackRate: 1.0,
                  };
                } else {
                  currentSession.playbackState.isPlaying = true;
                  currentSession.playbackState.currentTime = 0; // Only reset time for new songs
                }

                // Broadcast song started
                const sessionId = currentSession.id || "main-session";
                io.to(sessionId).emit("song-started", nextSong);
                io.to(sessionId).emit("queue-updated", currentSession.queue);
                io.to(sessionId).emit(
                  "playback-state-changed",
                  currentSession.playbackState,
                );
                console.log("Song started successfully");
              } else {
                console.log("No pending songs in queue");
                socket.emit("error", {
                  code: "NO_SONGS",
                  message: "No songs in queue to play",
                });
              }
            } else {
              console.log("Resuming current song");
              // Just resume playback - don't change currentTime
              if (!currentSession.playbackState) {
                currentSession.playbackState = {
                  isPlaying: true,
                  currentTime: 0,
                  volume: 80,
                  isMuted: false,
                  playbackRate: 1.0,
                };
              } else {
                currentSession.playbackState.isPlaying = true;
                // Keep existing currentTime - don't reset it
              }

              const sessionId = currentSession.id || "main-session";
              io.to(sessionId).emit(
                "playback-state-changed",
                currentSession.playbackState,
              );
            }
            break;
          case "pause":
            console.log("Processing pause command");
            if (!currentSession.playbackState) {
              currentSession.playbackState = {
                isPlaying: false,
                currentTime: 0,
                volume: 80,
                isMuted: false,
                playbackRate: 1.0,
              };
            } else {
              currentSession.playbackState.isPlaying = false;
              // Keep existing currentTime - don't reset it
            }

            const sessionId = currentSession.id || "main-session";
            io.to(sessionId).emit(
              "playback-state-changed",
              currentSession.playbackState,
            );
            break;
          case "volume":
            if (command.value !== undefined) {
              if (!currentSession.playbackState) {
                currentSession.playbackState = {
                  isPlaying: currentSession.currentSong ? true : false,
                  currentTime: 0,
                  volume: command.value,
                  isMuted: false,
                  playbackRate: 1.0,
                };
              } else {
                currentSession.playbackState.volume = command.value;
                // Keep existing currentTime and other properties
              }

              const sessionId = currentSession.id || "main-session";
              io.to(sessionId).emit(
                "playback-state-changed",
                currentSession.playbackState,
              );
            }
            break;
          case "seek":
            if (command.value !== undefined) {
              if (!currentSession.playbackState) {
                currentSession.playbackState = {
                  isPlaying: currentSession.currentSong ? true : false,
                  currentTime: command.value,
                  volume: 80,
                  isMuted: false,
                  playbackRate: 1.0,
                };
              } else {
                currentSession.playbackState.currentTime = command.value;
                // Keep existing other properties
              }

              const sessionId = currentSession.id || "main-session";
              io.to(sessionId).emit(
                "playback-state-changed",
                currentSession.playbackState,
              );
            }
            break;
          case "mute":
            if (!currentSession.playbackState) {
              currentSession.playbackState = {
                isPlaying: currentSession.currentSong ? true : false,
                currentTime: 0,
                volume: 80,
                isMuted: true,
                playbackRate: 1.0,
              };
            } else {
              currentSession.playbackState.isMuted = true;
              // Keep existing currentTime and other properties
            }

            const sessionId2 = currentSession.id || "main-session";
            io.to(sessionId2).emit(
              "playback-state-changed",
              currentSession.playbackState,
            );
            break;
          case "time-update":
            // Update the server's tracking of current playback time
            if (command.value !== undefined && currentSession.playbackState) {
              currentSession.playbackState.currentTime = command.value;
              // Don't broadcast time updates - they're just for server tracking
            }
            break;
          default:
            console.log("Unknown playback action:", command.action);
        }
      } catch (error) {
        console.error("Error handling playback control:", error);
        socket.emit("error", {
          code: "PLAYBACK_ERROR",
          message: "Failed to control playback",
        });
      }
    });

    socket.on("skip-song", () => {
      console.log("Skipping song");
      if (!currentSession || !currentSession.currentSong) {
        socket.emit("error", {
          code: "NO_CURRENT_SONG",
          message: "No song currently playing",
        });
        return;
      }

      // Mark current song as skipped and move to next
      const skippedSong = currentSession.currentSong;
      currentSession.currentSong = null;

      // Broadcast song ended
      io.to(currentSession.id).emit("song-ended", skippedSong);

      // Start next song if available
      const nextSong = currentSession.queue.find(
        (item) => item.status === "pending",
      );
      if (nextSong) {
        nextSong.status = "playing";
        currentSession.currentSong = nextSong;
        io.to(currentSession.id).emit("song-started", nextSong);
      }
    });

    socket.on("user-heartbeat", () => {
      // Update user's last seen time
      const user = connectedUsers.get(socket.id);
      if (user) {
        user.lastSeen = new Date();
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);

      const user = connectedUsers.get(socket.id);
      if (user && currentSession) {
        // Remove user from session
        currentSession.connectedUsers = currentSession.connectedUsers.filter(
          (u) => u.id !== user.id,
        );
        connectedUsers.delete(socket.id);

        // Notify other clients
        socket.to(currentSession.id).emit("user-left", { userId: user.id });

        // If no users left, clean up session
        if (currentSession.connectedUsers.length === 0) {
          currentSession = null;
          console.log("Session ended - no users remaining");
        }
      }
    });
  });

  server
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> WebSocket server running on port ${port}`);
    });
});
