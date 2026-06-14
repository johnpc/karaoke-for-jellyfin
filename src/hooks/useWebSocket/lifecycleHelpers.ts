import { MutableRefObject } from "react";
import { Socket } from "socket.io-client";
import { QueueItem, PlaybackState, KaraokeSession } from "@/types";

export function addEventListeners(
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

export function removeEventListeners(
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

export function cleanupTimers(
  reconnectTimeoutRef: MutableRefObject<NodeJS.Timeout | null>,
  heartbeatIntervalRef: MutableRefObject<NodeJS.Timeout | null>
): void {
  if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
  if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
}

export function disconnectSocket(
  socketRef: MutableRefObject<Socket | null>
): void {
  const currentSocket = socketRef.current;
  if (currentSocket) {
    currentSocket.removeAllListeners();
    currentSocket.disconnect();
  }
}

interface CypressTestSetters {
  setQueue: React.Dispatch<React.SetStateAction<QueueItem[]>>;
  setCurrentSong: React.Dispatch<React.SetStateAction<QueueItem | null>>;
  setPlaybackState: React.Dispatch<React.SetStateAction<PlaybackState | null>>;
  setSession: React.Dispatch<React.SetStateAction<KaraokeSession | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export function setupCypressTestHelpers(setters: CypressTestSetters): void {
  if (typeof window === "undefined") return;
  if (
    process.env.NODE_ENV !== "development" &&
    !(window as unknown as { Cypress?: boolean }).Cypress
  ) {
    return;
  }

  (window as unknown as Record<string, unknown>).webSocketTestHelpers = {
    setQueue: setters.setQueue,
    setCurrentSong: setters.setCurrentSong,
    setPlaybackState: setters.setPlaybackState,
    setSession: setters.setSession,
    setError: setters.setError,
  };
}
