import { MutableRefObject } from "react";
import { Socket } from "socket.io-client";
import { MediaItem } from "@/types";

export function handleAddSongConnected(
  socket: Socket,
  mediaItem: MediaItem,
  position: number | undefined,
  resolve: () => void,
  reject: (error: Error) => void
): void {
  const handleError = (error: { code: string; message: string }) => {
    if (error.code === "NOT_IN_SESSION" || error.code === "ADD_SONG_FAILED") {
      socket.off("error", handleError);
      socket.off("queue-updated", handleSuccess);
      reject(new Error(error.message));
    }
  };

  const handleSuccess = () => {
    socket.off("error", handleError);
    socket.off("queue-updated", handleSuccess);
    resolve();
  };

  socket.on("error", handleError);
  socket.on("queue-updated", handleSuccess);
  socket.emit("add-song", { mediaItem, position });
}

export function handleAddSongDisconnected(
  socketRef: MutableRefObject<Socket | null>,
  userNameRef: MutableRefObject<string | null>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  reject: (error: Error) => void
): void {
  if (userNameRef.current && socketRef.current) {
    setError("Connection lost. Attempting to reconnect...");
    socketRef.current.connect();
    reject(
      new Error(
        "Connection lost. Please wait for reconnection or refresh the page."
      )
    );
  } else {
    reject(new Error("Not connected to server. Please refresh the page."));
  }
}
