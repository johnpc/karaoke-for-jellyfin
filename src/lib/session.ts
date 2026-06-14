// Karaoke session creation and management utilities
import { KaraokeSession, ConnectedUser } from "@/types";
import { generateId } from "./validation";

export function createKaraokeSession(
  name: string,
  hostUser: ConnectedUser
): KaraokeSession {
  return {
    id: `session_${generateId()}`,
    name: name.trim(),
    queue: [],
    currentSong: null,
    playbackState: {
      isPlaying: false,
      currentTime: 0,
      volume: 80,
      isMuted: false,
      playbackRate: 1.0,
      lyricsOffset: 0,
    },
    connectedUsers: [hostUser],
    hostControls: {
      autoAdvance: true,
      allowUserSkip: false,
      allowUserRemove: true,
      maxSongsPerUser: 5,
      requireApproval: false,
    },
    settings: {
      displayName: name.trim(),
      isPublic: false,
      maxUsers: 50,
      lyricsEnabled: true,
      crossfadeEnabled: false,
      crossfadeDuration: 3,
    },
    createdAt: new Date(),
    lastActivity: new Date(),
  };
}

export function addUserToSession(
  session: KaraokeSession,
  user: ConnectedUser
): KaraokeSession {
  // Check if user already exists
  const existingUserIndex = session.connectedUsers.findIndex(
    u => u.id === user.id
  );

  if (existingUserIndex >= 0) {
    // Update existing user
    const updatedUsers = [...session.connectedUsers];
    updatedUsers[existingUserIndex] = { ...user, lastSeen: new Date() };

    return {
      ...session,
      connectedUsers: updatedUsers,
      lastActivity: new Date(),
    };
  }

  // Add new user
  return {
    ...session,
    connectedUsers: [...session.connectedUsers, user],
    lastActivity: new Date(),
  };
}

export function removeUserFromSession(
  session: KaraokeSession,
  userId: string
): KaraokeSession {
  return {
    ...session,
    connectedUsers: session.connectedUsers.filter(user => user.id !== userId),
    lastActivity: new Date(),
  };
}

export function updateSessionActivity(session: KaraokeSession): KaraokeSession {
  return {
    ...session,
    lastActivity: new Date(),
  };
}
