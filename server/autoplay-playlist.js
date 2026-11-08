// Auto-queue a Jellyfin playlist whenever the karaoke queue runs dry.
// Enabled by AUTOPLAY_PLAYLIST (playlist name or Jellyfin id); when nothing is
// pending or playing the playlist is appended (shuffled if
// AUTOPLAY_PLAYLIST_SHUFFLE) and the TV's existing autoplay takes over.

const AUTOPLAY_SOURCE_ID = "autoplay-playlist";

function parseBoolean(value) {
  return /^(1|true|yes|on)$/i.test(String(value || "").trim());
}

function getAutoplayPlaylistConfig(env = process.env) {
  const playlist = String(env.AUTOPLAY_PLAYLIST || "").trim();
  if (!playlist) return null;
  return { playlist, shuffle: parseBoolean(env.AUTOPLAY_PLAYLIST_SHUFFLE) };
}

// Fisher-Yates on a copy; `random` is injectable for deterministic tests.
function shuffleArray(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function normalizeName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

// Match a playlist by Jellyfin id first, then by case-insensitive name.
function resolvePlaylist(playlists, nameOrId) {
  const wanted = String(nameOrId || "").trim();
  if (!wanted) return null;
  const byId = playlists.find(
    p => p.id === wanted || p.jellyfinId === wanted || p.Id === wanted
  );
  if (byId) return byId;
  const wantedName = normalizeName(wanted);
  return (
    playlists.find(p => normalizeName(p.name ?? p.Name) === wantedName) || null
  );
}

function hasPendingSongs(session) {
  return session.queue.some(item => item.status === "pending");
}

function buildQueueItems(songs, playlistName, startPosition = 0) {
  const addedAt = new Date();
  return songs.map((mediaItem, index) => ({
    id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    mediaItem,
    addedBy: playlistName,
    addedByUserId: AUTOPLAY_SOURCE_ID,
    addedAt,
    position: startPosition + index,
    status: "pending",
  }));
}

const DISABLED = Object.freeze({
  enabled: false,
  playlistName: null,
  refillIfEmpty: async () => [],
});

// `config` comes from getAutoplayPlaylistConfig (null = disabled);
// `fetchPlaylistSongs(nameOrId)` resolves to { playlist: { name }, songs }.
// `log` and `random` are injectable for tests.
function createAutoplayPlaylist({
  config,
  fetchPlaylistSongs,
  log = console.log,
  random = Math.random,
}) {
  if (!config) return DISABLED;

  let playlistName = config.playlist;
  let inFlight = null;

  async function refill(session) {
    try {
      const { playlist, songs } = await fetchPlaylistSongs(config.playlist);
      playlistName = playlist?.name || config.playlist;
      if (!songs || songs.length === 0) {
        log(`Autoplay playlist "${playlistName}" has no playable songs`);
        return [];
      }
      // Songs queued by phones while we fetched stay ahead of the playlist.
      const ordered = config.shuffle ? shuffleArray(songs, random) : songs;
      const items = buildQueueItems(
        ordered,
        playlistName,
        session.queue.length
      );
      session.queue.push(...items);
      session.queue.forEach((item, index) => {
        item.position = index;
      });
      log(
        `Auto-queued ${items.length} song(s) from playlist "${playlistName}"` +
          (config.shuffle ? " (shuffled)" : "")
      );
      return items;
    } catch (error) {
      log(`Failed to auto-queue playlist "${config.playlist}":`, error.message);
      return [];
    } finally {
      inFlight = null;
    }
  }

  return {
    enabled: true,
    get playlistName() {
      return playlistName;
    },
    /**
     * Appends the playlist to `session.queue` when nothing is pending or
     * playing. Resolves with the appended queue items ([] when nothing was
     * added). Concurrent calls share one fetch.
     */
    refillIfEmpty(session) {
      if (!session || session.currentSong || hasPendingSongs(session)) {
        return Promise.resolve([]);
      }
      if (!inFlight) inFlight = refill(session);
      return inFlight;
    },
  };
}

module.exports = {
  AUTOPLAY_SOURCE_ID,
  getAutoplayPlaylistConfig,
  shuffleArray,
  resolvePlaylist,
  buildQueueItems,
  createAutoplayPlaylist,
};
