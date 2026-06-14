// Connected user creation and update utilities
import { ConnectedUser } from "@/types";
import { generateId } from "./validation";

export function createConnectedUser(
  name: string,
  isHost: boolean = false,
  socketId?: string
): ConnectedUser {
  const now = new Date();

  return {
    id: `user_${generateId()}`,
    name: name.trim(),
    isHost,
    connectedAt: now,
    lastSeen: now,
    socketId,
  };
}

export function updateUserLastSeen(user: ConnectedUser): ConnectedUser {
  return {
    ...user,
    lastSeen: new Date(),
  };
}
