const session = require("./session");

function getDebugState() {
  const currentSession = session.getSession();
  const connectedUsersSize = session.getConnectedUsersSize();

  if (!currentSession) {
    return { currentSession: null, connectedUsersMapSize: connectedUsersSize };
  }

  const uniqueUsers = currentSession.connectedUsers.reduce((acc, user) => {
    if (!acc.find(u => u.name === user.name)) {
      acc.push({
        name: user.name,
        isHost: user.isHost,
        connectedAt: user.connectedAt,
        lastSeen: user.lastSeen,
        socketId: user.socketId,
      });
    }
    return acc;
  }, []);

  return {
    currentSession: {
      id: currentSession.id,
      name: currentSession.name,
      queueLength: currentSession.queue?.length || 0,
      currentSong: currentSession.currentSong
        ? {
            title: currentSession.currentSong.mediaItem.title,
            status: currentSession.currentSong.status,
          }
        : null,
      connectedUsers: currentSession.connectedUsers?.length || 0,
      uniqueUsers,
      uniqueUserCount: uniqueUsers.length,
      queue:
        currentSession.queue?.map(item => ({
          title: item.mediaItem.title,
          artist: item.mediaItem.artist,
          status: item.status,
          addedBy: item.addedBy,
        })) || [],
    },
    connectedUsersMapSize: connectedUsersSize,
    duplicateDetection: {
      totalConnections: currentSession.connectedUsers?.length || 0,
      uniqueUsers: uniqueUsers.length,
      duplicatesRemoved:
        (currentSession.connectedUsers?.length || 0) - uniqueUsers.length,
    },
  };
}

module.exports = { getDebugState };
