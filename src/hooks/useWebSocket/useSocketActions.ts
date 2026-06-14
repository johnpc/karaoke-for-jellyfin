"use client";

import { useCallback } from "react";
import { MediaItem, PlaybackState, PlaybackCommand, QueueItem } from "@/types";
import {
  handleAddSongConnected,
  handleAddSongDisconnected,
} from "./addSongHelpers";
import { ActionDeps, SocketActions } from "./handlerTypes";

export type { SocketActions };

export function useSocketActions(deps: ActionDeps): SocketActions {
  const {
    socketRef,
    userNameRef,
    sessionIdRef,
    setError,
    setPlaybackState,
    songCompletedHandlerRef,
  } = deps;

  const joinSession = useCallback(
    (sessionId: string, userName: string) => {
      if (socketRef.current) {
        userNameRef.current = userName;
        sessionIdRef.current = sessionId;
        socketRef.current.emit("join-session", { sessionId, userName });
      }
    },
    [socketRef, userNameRef, sessionIdRef]
  );

  const addSong = useCallback(
    (mediaItem: MediaItem, position?: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (socketRef.current?.connected) {
          handleAddSongConnected(
            socketRef.current,
            mediaItem,
            position,
            resolve,
            reject
          );
        } else {
          handleAddSongDisconnected(socketRef, userNameRef, setError, reject);
        }
      });
    },
    [socketRef, userNameRef, setError]
  );

  const removeSong = useCallback(
    (queueItemId: string) => {
      if (socketRef.current)
        socketRef.current.emit("remove-song", { queueItemId });
    },
    [socketRef]
  );

  const reorderQueue = useCallback(
    (queueItemId: string, newPosition: number) => {
      if (socketRef.current)
        socketRef.current.emit("reorder-queue", { queueItemId, newPosition });
    },
    [socketRef]
  );

  const playbackControl = useCallback(
    (command: PlaybackCommand) => {
      if (socketRef.current)
        socketRef.current.emit("playback-control", command);
    },
    [socketRef]
  );

  const emitIfConnected = useCallback(
    (event: string) => {
      if (socketRef.current) socketRef.current.emit(event);
    },
    [socketRef]
  );

  const skipSong = useCallback(
    () => emitIfConnected("skip-song"),
    [emitIfConnected]
  );
  const songEnded = useCallback(
    () => emitIfConnected("song-ended"),
    [emitIfConnected]
  );
  const startNextSong = useCallback(
    () => emitIfConnected("start-next-song"),
    [emitIfConnected]
  );

  const sendReaction = useCallback(
    (emoji: string) => {
      if (socketRef.current) {
        socketRef.current.emit("send-reaction", { emoji });
      }
    },
    [socketRef]
  );

  const updateLocalPlaybackState = useCallback(
    (updates: Partial<PlaybackState>) => {
      setPlaybackState(prevState => {
        if (!prevState) {
          return {
            isPlaying: false,
            currentTime: 0,
            volume: 80,
            isMuted: false,
            playbackRate: 1.0,
            lyricsOffset: 0,
            ...updates,
          };
        }
        return { ...prevState, ...updates };
      });
    },
    [setPlaybackState]
  );

  const setSongCompletedHandler = useCallback(
    (handler: (data: { song: QueueItem; rating: unknown }) => void) => {
      songCompletedHandlerRef.current = handler;
    },
    [songCompletedHandlerRef]
  );

  return {
    joinSession,
    addSong,
    removeSong,
    reorderQueue,
    playbackControl,
    skipSong,
    songEnded,
    startNextSong,
    sendReaction,
    updateLocalPlaybackState,
    setSongCompletedHandler,
  };
}
