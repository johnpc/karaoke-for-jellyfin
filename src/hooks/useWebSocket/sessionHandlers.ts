import { Socket } from "socket.io-client";
import { ConnectedUser } from "@/types";
import { SessionSetters } from "./handlerTypes";

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
