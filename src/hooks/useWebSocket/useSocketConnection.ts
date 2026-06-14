"use client";

import { useEffect, useRef, useCallback, MutableRefObject } from "react";
import { Socket } from "socket.io-client";
import { QueueItem, PlaybackState, KaraokeSession } from "@/types";
import {
  setupSessionHandlers,
  setupConnectionHandlers,
  setupReconnectHandlers,
  setupErrorHandler,
} from "./socketHandlers";
import {
  createSocketFactory,
  getClientType,
  createVisibilityHandler,
  createNetworkHandlers,
} from "./connectionManager";
import {
  addEventListeners,
  removeEventListeners,
  cleanupTimers,
  disconnectSocket,
  setupCypressTestHelpers,
} from "./lifecycleHelpers";

type Setter<T> = React.Dispatch<React.SetStateAction<T>>;

export interface ConnectionSettersInput {
  setIsConnected: Setter<boolean>;
  setSession: Setter<KaraokeSession | null>;
  setQueue: Setter<QueueItem[]>;
  setCurrentSong: Setter<QueueItem | null>;
  setPlaybackState: Setter<PlaybackState | null>;
  setError: Setter<string | null>;
  songCompletedHandlerRef: MutableRefObject<
    ((data: { song: QueueItem; rating: unknown }) => void) | null
  >;
}

export function useSocketConnection(setters: ConnectionSettersInput): {
  socketRef: MutableRefObject<Socket | null>;
  userNameRef: MutableRefObject<string | null>;
  sessionIdRef: MutableRefObject<string>;
} {
  const socketRef = useRef<Socket | null>(null);
  const userNameRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string>("main-session");
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const {
    setIsConnected,
    setSession,
    setQueue,
    setCurrentSong,
    setPlaybackState,
    setError,
    songCompletedHandlerRef,
  } = setters;

  const rejoinSession = useCallback(() => {
    if (!socketRef.current?.connected || !userNameRef.current) return;
    socketRef.current.emit("join-session", {
      sessionId: sessionIdRef.current,
      userName: userNameRef.current,
    });
  }, []);

  const setupHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current)
      clearInterval(heartbeatIntervalRef.current);
    heartbeatIntervalRef.current = setInterval(() => {
      if (socketRef.current?.connected)
        socketRef.current.emit("user-heartbeat");
    }, 30000);
  }, []);

  const createSocket = useCallback(createSocketFactory(getClientType()), []);

  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;

    const setupSocketListeners = (socketInstance: Socket) => {
      setupSessionHandlers(socketInstance, {
        setSession,
        setQueue,
        setCurrentSong,
        setPlaybackState,
        setError,
        songCompletedHandlerRef,
      });
      setupConnectionHandlers(
        socketInstance,
        {
          setIsConnected,
          setError,
          setSession,
          setQueue,
          setCurrentSong,
          setPlaybackState,
        },
        {
          userNameRef,
          heartbeatIntervalRef,
          socketRef,
          reconnectTimeoutRef,
          setupHeartbeat,
          rejoinSession,
          createSocket,
          setupSocketListeners,
        }
      );
      setupReconnectHandlers(
        socketInstance,
        { setIsConnected, setError },
        { userNameRef, socketRef, createSocket, setupSocketListeners }
      );
      setupErrorHandler(
        socketInstance,
        { setError },
        {
          userNameRef,
          reconnectTimeoutRef,
          socketRef,
          createSocket,
          setupSocketListeners,
        }
      );
    };

    setupSocketListeners(socket);

    const handleVisibilityChange = createVisibilityHandler({
      socketRef,
      userNameRef,
      createSocket,
      setupSocketListeners,
      rejoinSession,
      hasSession: false,
    });
    const { handleOnline, handleOffline } = createNetworkHandlers({
      socketRef,
      userNameRef,
      createSocket,
      setupSocketListeners,
      setError,
    });

    addEventListeners(handleVisibilityChange, handleOnline, handleOffline);
    socket.connect();
    return () => {
      cleanupTimers(reconnectTimeoutRef, heartbeatIntervalRef);
      removeEventListeners(handleVisibilityChange, handleOnline, handleOffline);
      disconnectSocket(socketRef);
    };
  }, [rejoinSession, setupHeartbeat, createSocket]);

  useEffect(() => {
    setupCypressTestHelpers({
      setQueue,
      setCurrentSong,
      setPlaybackState,
      setSession,
      setError,
    });
  }, []);

  return { socketRef, userNameRef, sessionIdRef };
}
