const session = require("./session");
const { startPlayback } = require("./playback");
const { generateRandomRating } = require("./rating");
const { syncWithApiQueue } = require("./queue-sync");

const DEFAULT_PLAYBACK_STATE = {
  isPlaying: false,
  currentTime: 0,
  volume: 80,
  isMuted: false,
  playbackRate: 1.0,
  lyricsOffset: 0,
};

function getSessionOrError(socket) {
  const s = session.getSession();
  if (!s)
    socket.emit("error", {
      code: "NOT_IN_SESSION",
      message: "No active session",
    });
  return s;
}

function reindexQueue(queue) {
  queue.forEach((item, idx) => {
    item.position = idx;
  });
}

function resetPlaybackState(s) {
  if (s.playbackState) {
    Object.assign(s.playbackState, { currentTime: 0, isPlaying: false });
  } else {
    s.playbackState = { ...DEFAULT_PLAYBACK_STATE };
  }
}

function advanceToNextSong(io, s, sessionId) {
  const nextSong = s.queue.find(item => item.status === "pending");
  if (!nextSong) return;
  nextSong.status = "playing";
  s.currentSong = nextSong;
  startPlayback(s);
  io.to(sessionId).emit("song-started", nextSong);
  io.to(sessionId).emit("queue-updated", s.queue);
  io.to(sessionId).emit("playback-state-changed", s.playbackState);
}

function cleanQueue(s) {
  s.queue = s.queue
    .filter(item => item.status !== "completed" && item.status !== "skipped")
    .map((item, idx) => ({ ...item, position: idx }));
}

function handleAddSong(io, socket, data) {
  const user = session.getUser(socket.id);
  if (!user) {
    socket.emit("error", {
      code: "NOT_IN_SESSION",
      message: "You must join a session first",
    });
    return;
  }
  const s = getSessionOrError(socket);
  if (!s) return;

  const { mediaItem, position } = data;
  const queueItem = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    mediaItem,
    addedBy: user.name,
    addedByUserId: user.id,
    addedAt: new Date(),
    position: position ?? s.queue.length,
    status: "pending",
  };

  if (position !== undefined) {
    s.queue.splice(position, 0, queueItem);
  } else {
    s.queue.push(queueItem);
  }
  reindexQueue(s.queue);

  if (s.queue.length === 1 && !s.currentSong) {
    queueItem.status = "playing";
    s.currentSong = queueItem;
    startPlayback(s);
    const sessionId = s.id || "main-session";
    io.to(sessionId).emit("song-started", queueItem);
    io.to(sessionId).emit("playback-state-changed", s.playbackState);
  }

  syncWithApiQueue(mediaItem, user, position);
  io.to(s.id).emit("queue-updated", s.queue);
  io.to("main-session").emit("queue-updated", s.queue);
}

function handleRemoveSong(io, socket, data) {
  const s = getSessionOrError(socket);
  if (!s) return;
  const { queueItemId } = data;
  const idx = s.queue.findIndex(item => item.id === queueItemId);
  if (idx === -1) {
    socket.emit("error", {
      code: "SONG_NOT_FOUND",
      message: "Song not found in queue",
    });
    return;
  }
  s.queue.splice(idx, 1);
  reindexQueue(s.queue);
  io.to(s.id).emit("queue-updated", s.queue);
}

function handleSkipSong(io, socket) {
  const s = session.getSession();
  if (!s || !s.currentSong) {
    socket.emit("error", {
      code: "NO_CURRENT_SONG",
      message: "No song currently playing",
    });
    return;
  }
  s.currentSong.status = "skipped";
  const skippedSong = s.currentSong;
  cleanQueue(s);
  s.currentSong = null;
  resetPlaybackState(s);
  const sessionId = s.id || "main-session";
  io.to(sessionId).emit("song-ended", skippedSong);
  advanceToNextSong(io, s, sessionId);
}

function handleSongEnded(io) {
  const s = session.getSession();
  if (!s || !s.currentSong) return;
  const completedSong = s.currentSong;
  completedSong.status = "completed";
  cleanQueue(s);
  const rating = generateRandomRating();
  s.currentSong = null;
  resetPlaybackState(s);
  const nextSong = s.queue.find(item => item.status === "pending");
  const sessionId = s.id || "main-session";
  io.to(sessionId).emit("song-ended", {
    song: completedSong,
    rating,
    nextSong: nextSong || null,
  });
  if (nextSong) {
    io.to(sessionId).emit("queue-updated", s.queue);
  } else {
    io.to(sessionId).emit("playback-state-changed", s.playbackState);
  }
}

function handleStartNextSong(io) {
  const s = session.getSession();
  if (!s) return;
  advanceToNextSong(io, s, s.id || "main-session");
}

module.exports = {
  handleAddSong,
  handleRemoveSong,
  handleSkipSong,
  handleSongEnded,
  handleStartNextSong,
};
