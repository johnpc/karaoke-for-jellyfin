// WebSocket API route for Next.js
import { NextRequest } from "next/server";
import { Server as HTTPServer } from "http";
import { initializeWebSocket } from "@/lib/websocket";

export async function GET(request: NextRequest) {
  // In Next.js, we need to handle WebSocket upgrade differently
  // This endpoint provides information about WebSocket connection
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const host = request.headers.get("host") || "localhost:3000";

  return Response.json({
    message: "WebSocket server is running",
    websocketUrl: `${protocol === "https" ? "wss" : "ws"}://${host}`,
    endpoints: {
      "join-session": "Join a karaoke session",
      "add-song": "Add a song to the queue",
      "remove-song": "Remove a song from the queue",
      "reorder-queue": "Reorder the song queue",
      "playback-control": "Control playback (play/pause/volume/seek)",
      "skip-song": "Skip the current song",
      "user-heartbeat": "Keep connection alive",
    },
    events: {
      "session-updated": "Session state changed",
      "queue-updated": "Queue was modified",
      "song-started": "New song started playing",
      "song-ended": "Song finished playing",
      "user-joined": "User joined the session",
      "user-left": "User left the session",
      "playback-state-changed": "Playback state updated",
      "lyrics-sync": "Lyrics synchronization data",
      error: "Error occurred",
    },
  });
}
