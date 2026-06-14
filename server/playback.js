const session = require("./session");

function handlePlaybackControl(io, socket, command) {
  const currentSession = session.getSession();
  if (!currentSession) return;

  const sessionId = currentSession.id || "main-session";

  switch (command.action) {
    case "play":
      handlePlay(io, currentSession, sessionId);
      break;
    case "pause":
      handlePause(io, currentSession, sessionId);
      break;
    case "volume":
      handleVolume(io, currentSession, sessionId, command.value);
      break;
    case "seek":
      handleSeek(io, currentSession, sessionId, command.value);
      break;
    case "mute":
      handleMute(io, currentSession, sessionId);
      break;
    case "time-update":
      handleTimeUpdate(socket, currentSession, command.value);
      break;
    case "lyrics-offset":
      handleLyricsOffset(io, currentSession, sessionId, command.value);
      break;
    default:
      console.log("Unknown playback action:", command.action);
  }
}

function handlePlay(io, currentSession, sessionId) {
  if (!currentSession.currentSong) {
    const nextSong = currentSession.queue.find(
      item => item.status === "pending"
    );
    if (!nextSong) return;

    nextSong.status = "playing";
    currentSession.currentSong = nextSong;
    startPlayback(currentSession);

    io.to(sessionId).emit("song-started", nextSong);
    io.to(sessionId).emit("queue-updated", currentSession.queue);
    io.to(sessionId).emit(
      "playback-state-changed",
      currentSession.playbackState
    );
  } else {
    resumePlayback(currentSession);
    io.to(sessionId).emit(
      "playback-state-changed",
      currentSession.playbackState
    );
  }
}

function handlePause(io, currentSession, sessionId) {
  const state = session.ensurePlaybackState({ isPlaying: false });
  state.isPlaying = false;
  io.to(sessionId).emit("playback-state-changed", currentSession.playbackState);
}

function handleVolume(io, currentSession, sessionId, value) {
  if (value === undefined) return;
  const state = session.ensurePlaybackState({
    isPlaying: !!currentSession.currentSong,
    volume: value,
  });
  state.volume = value;
  io.to(sessionId).emit("playback-state-changed", currentSession.playbackState);
}

function handleSeek(io, currentSession, sessionId, value) {
  if (value === undefined) return;
  const state = session.ensurePlaybackState({
    isPlaying: !!currentSession.currentSong,
    currentTime: value,
  });
  state.currentTime = value;
  io.to(sessionId).emit("playback-state-changed", currentSession.playbackState);
}

function handleMute(io, currentSession, sessionId) {
  const state = session.ensurePlaybackState({
    isPlaying: !!currentSession.currentSong,
    isMuted: true,
  });
  state.isMuted = !state.isMuted;
  io.to(sessionId).emit("playback-state-changed", currentSession.playbackState);
}

function handleTimeUpdate(socket, currentSession, value) {
  if (value === undefined || !currentSession.playbackState) return;
  currentSession.playbackState.currentTime = value;
  socket.broadcast.emit("playback-state-changed", currentSession.playbackState);
}

function handleLyricsOffset(io, currentSession, sessionId, value) {
  if (value === undefined) return;
  const state = session.ensurePlaybackState({
    isPlaying: !!currentSession.currentSong,
    lyricsOffset: value,
  });
  state.lyricsOffset = value;
  io.to(sessionId).emit("playback-state-changed", currentSession.playbackState);
}

function startPlayback(currentSession) {
  if (!currentSession.playbackState) {
    currentSession.playbackState = {
      isPlaying: true,
      currentTime: 0,
      volume: 80,
      isMuted: false,
      playbackRate: 1.0,
      lyricsOffset: 0,
    };
  } else {
    currentSession.playbackState.isPlaying = true;
    currentSession.playbackState.currentTime = 0;
  }
}

function resumePlayback(currentSession) {
  if (!currentSession.playbackState) {
    currentSession.playbackState = {
      isPlaying: true,
      currentTime: 0,
      volume: 80,
      isMuted: false,
      playbackRate: 1.0,
      lyricsOffset: 0,
    };
  } else {
    currentSession.playbackState.isPlaying = true;
  }
}

module.exports = { handlePlaybackControl, startPlayback };
