const session = require("./session");
const { startPlayback } = require("./playback");

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

module.exports = {
  getSessionOrError,
  reindexQueue,
  resetPlaybackState,
  advanceToNextSong,
  cleanQueue,
};
