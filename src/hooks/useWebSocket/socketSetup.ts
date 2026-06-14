import { Socket } from "socket.io-client";
import { MutableRefObject } from "react";
import {
  setupSessionHandlers,
  setupConnectionHandlers,
  setupReconnectHandlers,
  setupErrorHandler,
} from "./socketHandlers";
import { ConnectionSettersInput } from "./useSocketConnection";

type Setter<T> = React.Dispatch<React.SetStateAction<T>>;

export interface SetupContext {
  setters: ConnectionSettersInput;
  userNameRef: MutableRefObject<string | null>;
  heartbeatIntervalRef: MutableRefObject<NodeJS.Timeout | null>;
  socketRef: MutableRefObject<Socket | null>;
  reconnectTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  setupHeartbeat: () => void;
  rejoinSession: () => void;
  createSocket: () => Socket;
}

export function createSocketListenerSetup(ctx: SetupContext) {
  const setupSocketListeners = (socketInstance: Socket) => {
    setupSessionHandlers(socketInstance, {
      setSession: ctx.setters.setSession,
      setQueue: ctx.setters.setQueue,
      setCurrentSong: ctx.setters.setCurrentSong,
      setPlaybackState: ctx.setters.setPlaybackState,
      setError: ctx.setters.setError,
      songCompletedHandlerRef: ctx.setters.songCompletedHandlerRef,
    });
    setupConnectionHandlers(
      socketInstance,
      {
        setIsConnected: ctx.setters.setIsConnected,
        setError: ctx.setters.setError,
        setSession: ctx.setters.setSession,
        setQueue: ctx.setters.setQueue,
        setCurrentSong: ctx.setters.setCurrentSong,
        setPlaybackState: ctx.setters.setPlaybackState,
      },
      {
        userNameRef: ctx.userNameRef,
        heartbeatIntervalRef: ctx.heartbeatIntervalRef,
        socketRef: ctx.socketRef,
        reconnectTimeoutRef: ctx.reconnectTimeoutRef,
        setupHeartbeat: ctx.setupHeartbeat,
        rejoinSession: ctx.rejoinSession,
        createSocket: ctx.createSocket,
        setupSocketListeners,
      }
    );
    setupReconnectHandlers(
      socketInstance,
      {
        setIsConnected: ctx.setters.setIsConnected,
        setError: ctx.setters.setError,
      },
      {
        userNameRef: ctx.userNameRef,
        socketRef: ctx.socketRef,
        createSocket: ctx.createSocket,
        setupSocketListeners,
      }
    );
    setupErrorHandler(
      socketInstance,
      { setError: ctx.setters.setError },
      {
        userNameRef: ctx.userNameRef,
        reconnectTimeoutRef: ctx.reconnectTimeoutRef,
        socketRef: ctx.socketRef,
        createSocket: ctx.createSocket,
        setupSocketListeners,
      }
    );
  };
  return setupSocketListeners;
}
