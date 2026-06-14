"use client";

import { useRef, useState } from "react";
import { Socket } from "socket.io-client";
import {
  MediaItem,
  QueueItem,
  PlaybackState,
  KaraokeSession,
  PlaybackCommand,
} from "@/types";
import { useSocketConnection } from "./useSocketConnection";
import { useSocketActions } from "./useSocketActions";

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

export function useWebSocket(): WebSocketHookReturn {
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

  const { socketRef, userNameRef, sessionIdRef } = useSocketConnection({
    setIsConnected,
    setSession,
    setQueue,
    setCurrentSong,
    setPlaybackState,
    setError,
    songCompletedHandlerRef,
  });

  const actions = useSocketActions({
    socketRef,
    userNameRef,
    sessionIdRef,
    setError,
    setPlaybackState,
    songCompletedHandlerRef,
  });

  return {
    socket: socketRef.current,
    isConnected,
    session,
    queue,
    currentSong,
    playbackState,
    error,
    ...actions,
  };
}
