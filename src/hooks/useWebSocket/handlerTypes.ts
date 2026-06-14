import { Socket } from "socket.io-client";
import { Dispatch, SetStateAction, MutableRefObject } from "react";
import { KaraokeSession, QueueItem, PlaybackState } from "@/types";

export interface SessionSetters {
  setSession: Dispatch<SetStateAction<KaraokeSession | null>>;
  setQueue: Dispatch<SetStateAction<QueueItem[]>>;
  setCurrentSong: Dispatch<SetStateAction<QueueItem | null>>;
  setPlaybackState: Dispatch<SetStateAction<PlaybackState | null>>;
  setError: Dispatch<SetStateAction<string | null>>;
  songCompletedHandlerRef: MutableRefObject<
    ((data: { song: QueueItem; rating: unknown }) => void) | null
  >;
}

export interface ConnectionSetters {
  setIsConnected: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setSession: Dispatch<SetStateAction<KaraokeSession | null>>;
  setQueue: Dispatch<SetStateAction<QueueItem[]>>;
  setCurrentSong: Dispatch<SetStateAction<QueueItem | null>>;
  setPlaybackState: Dispatch<SetStateAction<PlaybackState | null>>;
}

export interface ConnectionOptions {
  userNameRef: MutableRefObject<string | null>;
  heartbeatIntervalRef: MutableRefObject<NodeJS.Timeout | null>;
  socketRef: MutableRefObject<Socket | null>;
  reconnectTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  setupHeartbeat: () => void;
  rejoinSession: () => void;
  createSocket: () => Socket;
  setupSocketListeners: (socket: Socket) => void;
}

export interface ActionDeps {
  socketRef: MutableRefObject<Socket | null>;
  userNameRef: MutableRefObject<string | null>;
  sessionIdRef: MutableRefObject<string>;
  setError: Dispatch<SetStateAction<string | null>>;
  setPlaybackState: Dispatch<SetStateAction<PlaybackState | null>>;
  songCompletedHandlerRef: MutableRefObject<
    ((data: { song: QueueItem; rating: unknown }) => void) | null
  >;
}

export interface SocketActions {
  joinSession: (sessionId: string, userName: string) => void;
  addSong: (
    mediaItem: import("@/types").MediaItem,
    position?: number
  ) => Promise<void>;
  removeSong: (queueItemId: string) => void;
  reorderQueue: (queueItemId: string, newPosition: number) => void;
  playbackControl: (command: import("@/types").PlaybackCommand) => void;
  skipSong: () => void;
  songEnded: () => void;
  startNextSong: () => void;
  sendReaction: (emoji: string) => void;
  updateLocalPlaybackState: (updates: Partial<PlaybackState>) => void;
  setSongCompletedHandler: (
    handler: (data: { song: QueueItem; rating: unknown }) => void
  ) => void;
}
