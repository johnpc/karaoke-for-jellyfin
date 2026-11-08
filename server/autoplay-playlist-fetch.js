// Resolves the AUTOPLAY_PLAYLIST setting to a list of playable songs.
//
// The playlist is looked up directly in Jellyfin (so PLAYLIST_FILTER_REGEX
// cannot hide it), then its songs are loaded through the app's own
// /api/playlists/:id/items route so they get exactly the same transforms
// (stream URLs, lyrics filtering) as songs queued from a phone.
const nodeFetch = require("node-fetch");
const { resolvePlaylist } = require("./autoplay-playlist");

const JELLYFIN_ID_PATTERN = /^[0-9a-f]{32}$/i;

async function getJson(fetchImpl, url, options) {
  const response = await fetchImpl(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }
  return response.json();
}

async function listJellyfinPlaylists(fetchImpl, jellyfinUrl, apiKey) {
  const params = new URLSearchParams({
    IncludeItemTypes: "Playlist",
    Recursive: "true",
    Limit: "1000",
  });
  const base = jellyfinUrl.replace(/\/+$/, "");
  const data = await getJson(fetchImpl, `${base}/Items?${params}`, {
    headers: { Authorization: `MediaBrowser Token="${apiKey}"` },
  });
  return data.Items || [];
}

/**
 * @param {object} options
 * @param {string} options.appBaseUrl   e.g. http://localhost:3000
 * @param {string} [options.jellyfinUrl] JELLYFIN_SERVER_URL
 * @param {string} [options.apiKey]      JELLYFIN_API_KEY
 * @param {typeof nodeFetch} [options.fetchImpl]
 */
function createPlaylistSongFetcher({
  appBaseUrl,
  jellyfinUrl,
  apiKey,
  fetchImpl = nodeFetch,
}) {
  return async function fetchPlaylistSongs(nameOrId) {
    if (!jellyfinUrl || !apiKey) {
      throw new Error(
        "JELLYFIN_SERVER_URL and JELLYFIN_API_KEY must be set to use AUTOPLAY_PLAYLIST"
      );
    }

    const playlists = await listJellyfinPlaylists(
      fetchImpl,
      jellyfinUrl,
      apiKey
    );
    let match = resolvePlaylist(playlists, nameOrId);
    if (!match && JELLYFIN_ID_PATTERN.test(nameOrId.trim())) {
      // Not in the listing but looks like an id: let Jellyfin decide.
      match = { Id: nameOrId.trim(), Name: nameOrId.trim() };
    }
    if (!match) {
      const names = playlists.map(p => `"${p.Name}"`).join(", ") || "none";
      throw new Error(
        `playlist "${nameOrId}" not found. Available playlists: ${names}`
      );
    }

    const playlistId = match.Id || match.jellyfinId || match.id;
    const items = await getJson(
      fetchImpl,
      `${appBaseUrl}/api/playlists/${encodeURIComponent(playlistId)}/items?limit=1000`
    );

    return {
      playlist: { id: playlistId, name: match.Name || match.name || nameOrId },
      songs: items.data || [],
    };
  };
}

module.exports = { createPlaylistSongFetcher };
