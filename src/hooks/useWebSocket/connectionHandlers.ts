import { Socket } from "socket.io-client";
import { MutableRefObject } from "react";
import { ConnectionSetters, ConnectionOptions } from "./handlerTypes";

function setupConnectHandler(
  socketInstance: Socket,
  setters: ConnectionSetters,
  options: Pick<
    ConnectionOptions,
    "userNameRef" | "setupHeartbeat" | "rejoinSession"
  >
): void {
  const {
    setIsConnected,
    setError,
    setSession,
    setQueue,
    setCurrentSong,
    setPlaybackState,
  } = setters;
  const { userNameRef, setupHeartbeat, rejoinSession } = options;

  socketInstance.on("connect", () => {
    console.log("✅ Connected to WebSocket server with fresh socket");
    setIsConnected(true);
    setError(null);
    setupHeartbeat();

    if (userNameRef.current) {
      console.log("🔄 Auto-rejoining session with fresh connection");
      setSession(null);
      setQueue([]);
      setCurrentSong(null);
      setPlaybackState(null);

      setTimeout(() => {
        rejoinSession();
      }, 500);
    }
  });
}

function handleTransportDisconnect(
  socketInstance: Socket,
  userNameRef: MutableRefObject<string | null>,
  socketRef: MutableRefObject<Socket | null>,
  createSocket: () => Socket,
  setupSocketListeners: (socket: Socket) => void
): void {
  setTimeout(() => {
    if (userNameRef.current) {
      console.log("🔄 Creating fresh socket connection...");
      socketInstance.removeAllListeners();
      socketInstance.disconnect();

      const newSocket = createSocket();
      socketRef.current = newSocket;
      setupSocketListeners(newSocket);
      newSocket.connect();
    }
  }, 2000);
}

function setupDisconnectHandler(
  socketInstance: Socket,
  setters: Pick<ConnectionSetters, "setIsConnected" | "setError">,
  options: Pick<
    ConnectionOptions,
    | "heartbeatIntervalRef"
    | "userNameRef"
    | "socketRef"
    | "createSocket"
    | "setupSocketListeners"
  >
): void {
  const { setIsConnected, setError } = setters;
  const {
    heartbeatIntervalRef,
    userNameRef,
    socketRef,
    createSocket,
    setupSocketListeners,
  } = options;

  socketInstance.on("disconnect", reason => {
    console.log("❌ Disconnected from WebSocket server:", reason);
    setIsConnected(false);

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (reason === "io server disconnect") {
      setError("Server disconnected the connection");
    } else if (reason === "transport close" || reason === "transport error") {
      setError("Connection lost - creating fresh connection...");
      handleTransportDisconnect(
        socketInstance,
        userNameRef,
        socketRef,
        createSocket,
        setupSocketListeners
      );
    } else {
      setError("Disconnected - attempting to reconnect...");
    }
  });
}

export function setupConnectionHandlers(
  socketInstance: Socket,
  setters: ConnectionSetters,
  options: ConnectionOptions
): void {
  setupConnectHandler(socketInstance, setters, {
    userNameRef: options.userNameRef,
    setupHeartbeat: options.setupHeartbeat,
    rejoinSession: options.rejoinSession,
  });

  setupDisconnectHandler(socketInstance, setters, {
    heartbeatIntervalRef: options.heartbeatIntervalRef,
    userNameRef: options.userNameRef,
    socketRef: options.socketRef,
    createSocket: options.createSocket,
    setupSocketListeners: options.setupSocketListeners,
  });
}
