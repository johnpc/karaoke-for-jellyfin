function handleSendReaction(io, socket, data, connectedUsers, currentSession) {
  const user = connectedUsers.get(socket.id);
  if (!user) {
    socket.emit("error", {
      code: "NOT_IN_SESSION",
      message: "You must join a session first",
    });
    return;
  }

  if (!currentSession) {
    socket.emit("error", {
      code: "NOT_IN_SESSION",
      message: "No active session",
    });
    return;
  }

  const { emoji } = data;
  if (!emoji) {
    socket.emit("error", {
      code: "INVALID_REACTION",
      message: "Emoji is required",
    });
    return;
  }

  const reaction = {
    id: `reaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    emoji,
    userId: user.id,
    userName: user.name,
    timestamp: Date.now(),
  };

  const sessionId = currentSession.id || "main-session";
  io.to(sessionId).emit("reaction-received", reaction);
}

module.exports = { handleSendReaction };
