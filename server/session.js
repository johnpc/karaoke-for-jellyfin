const DISCONNECT_GRACE_MS = 30_000;
const STALE_THRESHOLD_MS = 5 * 60 * 1000;

const DEFAULT_PLAYBACK_STATE = {
  isPlaying: false,
  currentTime: 0,
  volume: 80,
  isMuted: false,
  playbackRate: 1.0,
  lyricsOffset: 0,
};

let currentSession = null;
const connectedUsers = new Map();
const disconnectTimers = new Map();

function getSession() {
  return currentSession;
}

function getPlaybackState() {
  return currentSession?.playbackState || { ...DEFAULT_PLAYBACK_STATE };
}

function ensurePlaybackState(overrides = {}) {
  if (!currentSession) return;
  if (!currentSession.playbackState) {
    currentSession.playbackState = { ...DEFAULT_PLAYBACK_STATE, ...overrides };
  }
  return currentSession.playbackState;
}

function createSessionIfNeeded(sessionId) {
  if (!currentSession) {
    currentSession = {
      id: sessionId,
      name: "Karaoke Session",
      queue: [],
      currentSong: null,
      connectedUsers: [],
      createdAt: new Date(),
    };
  }
  return currentSession;
}

function deduplicateUser(userName) {
  if (!currentSession) return;
  const idx = currentSession.connectedUsers.findIndex(u => u.name === userName);
  if (idx === -1) return;
  const existing = currentSession.connectedUsers[idx];
  currentSession.connectedUsers.splice(idx, 1);
  for (const [socketId, user] of connectedUsers.entries()) {
    if (user.name === userName) {
      connectedUsers.delete(socketId);
      break;
    }
  }
  if (disconnectTimers.has(userName)) {
    clearTimeout(disconnectTimers.get(userName));
    disconnectTimers.delete(userName);
  }
  return existing;
}

function addUser(socketId, userName, isHost = false) {
  const user = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: userName,
    socketId,
    isHost: isHost || currentSession.connectedUsers.length === 0,
    connectedAt: new Date(),
    lastSeen: new Date(),
  };
  currentSession.connectedUsers.push(user);
  connectedUsers.set(socketId, user);
  return user;
}

function getUser(socketId) {
  return connectedUsers.get(socketId);
}

function removeUser(socketId, io) {
  const user = connectedUsers.get(socketId);
  if (!user || !currentSession) return null;

  disconnectTimers.set(
    user.name,
    setTimeout(() => {
      disconnectTimers.delete(user.name);
      const stillGone = !Array.from(connectedUsers.values()).some(
        u => u.name === user.name
      );
      if (!stillGone) return;
      currentSession.connectedUsers = currentSession.connectedUsers.filter(
        u => u.id !== user.id
      );
      if (io && currentSession) {
        io.to(currentSession.id).emit("user-left", { userId: user.id });
      }
      if (currentSession && currentSession.connectedUsers.length === 0) {
        currentSession = null;
      }
    }, DISCONNECT_GRACE_MS)
  );

  connectedUsers.delete(socketId);
  return user;
}

function updateHeartbeat(socketId) {
  const user = connectedUsers.get(socketId);
  if (user) user.lastSeen = new Date();
}

function cleanupStaleConnections() {
  if (!currentSession) return;
  const now = new Date();
  currentSession.connectedUsers = currentSession.connectedUsers.filter(user => {
    if (now - new Date(user.lastSeen) > STALE_THRESHOLD_MS) {
      connectedUsers.delete(user.socketId);
      return false;
    }
    return true;
  });
}

function getConnectedUsersSize() {
  return connectedUsers.size;
}

module.exports = {
  getSession,
  getPlaybackState,
  ensurePlaybackState,
  createSessionIfNeeded,
  deduplicateUser,
  addUser,
  getUser,
  removeUser,
  updateHeartbeat,
  cleanupStaleConnections,
  getConnectedUsersSize,
  DEFAULT_PLAYBACK_STATE,
};
