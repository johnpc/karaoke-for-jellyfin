import { Socket } from "socket.io-client";
import { Dispatch, SetStateAction, MutableRefObject } from "react";
import { ConnectionSetters, ConnectionOptions } from "./handlerTypes";

function handleReconnectFailed(
  socketInstance: Socket,
  userNameRef: MutableRefObject<string | null>,
  socketRef: MutableRefObject<Socket | null>,
  createSocket: () => Socket,
  setupSocketListeners: (socket: Socket) => void,
  setError: Dispatch<SetStateAction<string | null>>
): void {
  if (userNameRef.current) {
    setTimeout(() => {
      console.log("🔄 Creating fresh socket after reconnect failure...");
      socketInstance.removeAllListeners();
      socketInstance.disconnect();

      const newSocket = createSocket();
      socketRef.current = newSocket;
      setupSocketListeners(newSocket);
      newSocket.connect();
    }, 3000);
  } else {
    setError("Failed to reconnect. Please refresh the page.");
  }
}

export function setupReconnectHandlers(
  socketInstance: Socket,
  setters: Pick<ConnectionSetters, "setIsConnected" | "setError">,
  options: Pick<
    ConnectionOptions,
    "userNameRef" | "socketRef" | "createSocket" | "setupSocketListeners"
  >
): void {
  const { setIsConnected, setError } = setters;
  const { userNameRef, socketRef, createSocket, setupSocketListeners } =
    options;

  socketInstance.on("connect_error", err => {
    console.error("❌ WebSocket connection error:", err);
    setError("Connection failed: " + (err.message || "Unknown error"));
    setIsConnected(false);
  });

  socketInstance.on("reconnect", (attemptNumber: number) => {
    console.log(`✅ WebSocket reconnected after ${attemptNumber} attempts`);
    console.log(`✅ New socket ID after reconnect:`, socketInstance.id);
    console.log(`✅ Will auto-rejoin as:`, userNameRef.current);
    setError(null);
  });

  socketInstance.on("reconnect_attempt", (attemptNumber: number) => {
    console.log(`🔄 WebSocket reconnection attempt ${attemptNumber}`);
    setError(`Reconnecting... (attempt ${attemptNumber})`);
  });

  socketInstance.on("reconnect_failed", () => {
    console.error(
      "❌ WebSocket reconnection failed, creating fresh connection..."
    );
    handleReconnectFailed(
      socketInstance,
      userNameRef,
      socketRef,
      createSocket,
      setupSocketListeners,
      setError
    );
  });
}

function handleSessionLostError(
  socketInstance: Socket,
  setError: Dispatch<SetStateAction<string | null>>,
  reconnectTimeoutRef: MutableRefObject<NodeJS.Timeout | null>,
  socketRef: MutableRefObject<Socket | null>,
  createSocket: () => Socket,
  setupSocketListeners: (socket: Socket) => void
): void {
  console.log("🔄 Session lost, creating fresh connection...");
  setError("Session lost - reconnecting with fresh connection...");

  if (reconnectTimeoutRef.current) {
    clearTimeout(reconnectTimeoutRef.current);
  }

  reconnectTimeoutRef.current = setTimeout(() => {
    console.log("🔄 Creating fresh socket due to session loss...");
    socketInstance.removeAllListeners();
    socketInstance.disconnect();

    const newSocket = createSocket();
    socketRef.current = newSocket;
    setupSocketListeners(newSocket);
    newSocket.connect();
  }, 2000);
}

export function setupErrorHandler(
  socketInstance: Socket,
  setters: Pick<ConnectionSetters, "setError">,
  options: Pick<
    ConnectionOptions,
    | "userNameRef"
    | "reconnectTimeoutRef"
    | "socketRef"
    | "createSocket"
    | "setupSocketListeners"
  >
): void {
  const { setError } = setters;
  const {
    userNameRef,
    reconnectTimeoutRef,
    socketRef,
    createSocket,
    setupSocketListeners,
  } = options;

  socketInstance.on(
    "error",
    (errorData: { code?: string; message?: string }) => {
      console.error("❌ WebSocket error:", errorData);

      if (errorData.code === "NOT_IN_SESSION" && userNameRef.current) {
        handleSessionLostError(
          socketInstance,
          setError,
          reconnectTimeoutRef,
          socketRef,
          createSocket,
          setupSocketListeners
        );
      } else {
        setError(errorData.message || "An error occurred");
      }
    }
  );
}
