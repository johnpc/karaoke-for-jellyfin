import { describe, it, expect, vi } from "vitest";
import {
  AUTOPLAY_SOURCE_ID,
  getAutoplayPlaylistConfig,
  shuffleArray,
  resolvePlaylist,
  buildQueueItems,
  createAutoplayPlaylist,
} from "../../server/autoplay-playlist";

type Song = { id: string; title: string };
type QueueItem = {
  id: string;
  mediaItem: Song;
  addedBy: string;
  addedByUserId?: string;
  position: number;
  status: string;
};
type Session = {
  id: string;
  queue: QueueItem[];
  currentSong: QueueItem | null;
};

const songs: Song[] = [
  { id: "s1", title: "Let It Go" },
  { id: "s2", title: "Under the Sea" },
  { id: "s3", title: "Hakuna Matata" },
];

function makeSession(overrides: Partial<Session> = {}): Session {
  return { id: "main-session", queue: [], currentSong: null, ...overrides };
}

function makeQueueItem(status: string, title = "Song"): QueueItem {
  return {
    id: `q_${title}`,
    mediaItem: { id: title, title },
    addedBy: "alice",
    position: 0,
    status,
  };
}

// Mocked Jellyfin-backed fetcher: resolves to a fixed playlist
function mockFetcher(result = { playlist: { name: "Kids Karaoke" }, songs }) {
  return vi.fn().mockResolvedValue(result);
}

describe("getAutoplayPlaylistConfig", () => {
  it("returns null when AUTOPLAY_PLAYLIST is unset or blank", () => {
    expect(getAutoplayPlaylistConfig({})).toBeNull();
    expect(getAutoplayPlaylistConfig({ AUTOPLAY_PLAYLIST: "  " })).toBeNull();
  });

  it("trims the playlist and defaults shuffle to false", () => {
    expect(getAutoplayPlaylistConfig({ AUTOPLAY_PLAYLIST: " Kids " })).toEqual({
      playlist: "Kids",
      shuffle: false,
    });
  });

  it.each(["true", "TRUE", "1", "yes", "on"])(
    "enables shuffle for AUTOPLAY_PLAYLIST_SHUFFLE=%s",
    value => {
      const config = getAutoplayPlaylistConfig({
        AUTOPLAY_PLAYLIST: "Kids",
        AUTOPLAY_PLAYLIST_SHUFFLE: value,
      });
      expect(config?.shuffle).toBe(true);
    }
  );

  it("treats other shuffle values as false", () => {
    const config = getAutoplayPlaylistConfig({
      AUTOPLAY_PLAYLIST: "Kids",
      AUTOPLAY_PLAYLIST_SHUFFLE: "false",
    });
    expect(config?.shuffle).toBe(false);
  });
});

describe("shuffleArray", () => {
  it("returns a permutation without mutating the input", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect([...result].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("is deterministic for a given random source", () => {
    const rng = () => 0; // always swap with index 0
    expect(shuffleArray(["a", "b", "c"], rng)).toEqual(["b", "c", "a"]);
  });
});

describe("resolvePlaylist", () => {
  const playlists = [
    { id: "jellyfin_playlist_abc", jellyfinId: "abc", name: "Kids Karaoke" },
    { Id: "def", Name: "Party  Mix" },
  ];

  it("matches by app id, jellyfin id, or raw Jellyfin Id", () => {
    expect(resolvePlaylist(playlists, "jellyfin_playlist_abc")?.name).toBe(
      "Kids Karaoke"
    );
    expect(resolvePlaylist(playlists, "abc")?.name).toBe("Kids Karaoke");
    expect(resolvePlaylist(playlists, "def")).toBe(playlists[1]);
  });

  it("matches names case-insensitively and whitespace-insensitively", () => {
    expect(resolvePlaylist(playlists, "kids karaoke")).toBe(playlists[0]);
    expect(resolvePlaylist(playlists, " party mix ")).toBe(playlists[1]);
  });

  it("returns null when nothing matches or the query is blank", () => {
    expect(resolvePlaylist(playlists, "Nope")).toBeNull();
    expect(resolvePlaylist(playlists, "")).toBeNull();
  });
});

describe("buildQueueItems", () => {
  it("creates pending items attributed to the playlist", () => {
    const items = buildQueueItems(songs, "Kids Karaoke", 2);
    expect(items).toHaveLength(3);
    expect(items.map((i: QueueItem) => i.position)).toEqual([2, 3, 4]);
    for (const item of items) {
      expect(item.status).toBe("pending");
      expect(item.addedBy).toBe("Kids Karaoke");
      expect(item.addedByUserId).toBe(AUTOPLAY_SOURCE_ID);
      expect(item.id).toMatch(/^queue_/);
    }
    expect(new Set(items.map((i: QueueItem) => i.id)).size).toBe(3);
  });
});

describe("createAutoplayPlaylist", () => {
  it("is a no-op when not configured", async () => {
    const fetchPlaylistSongs = mockFetcher();
    const autoplay = createAutoplayPlaylist({
      config: null,
      fetchPlaylistSongs,
    });
    const session = makeSession();

    expect(autoplay.enabled).toBe(false);
    expect(await autoplay.refillIfEmpty(session)).toEqual([]);
    expect(fetchPlaylistSongs).not.toHaveBeenCalled();
    expect(session.queue).toEqual([]);
  });

  it("fills an empty queue in playlist order and reports the playlist name", async () => {
    const fetchPlaylistSongs = mockFetcher();
    const autoplay = createAutoplayPlaylist({
      config: { playlist: "kids karaoke", shuffle: false },
      fetchPlaylistSongs,
      log: vi.fn(),
    });
    const session = makeSession();

    const added = await autoplay.refillIfEmpty(session);

    expect(fetchPlaylistSongs).toHaveBeenCalledWith("kids karaoke");
    expect(added).toHaveLength(3);
    expect(session.queue).toBe(session.queue);
    expect(session.queue.map(i => i.mediaItem.title)).toEqual([
      "Let It Go",
      "Under the Sea",
      "Hakuna Matata",
    ]);
    expect(session.queue.map(i => i.position)).toEqual([0, 1, 2]);
    expect(session.queue.every(i => i.status === "pending")).toBe(true);
    expect(session.queue.every(i => i.addedBy === "Kids Karaoke")).toBe(true);
    expect(autoplay.playlistName).toBe("Kids Karaoke");
  });

  it("shuffles when configured, using the injected random source", async () => {
    const autoplay = createAutoplayPlaylist({
      config: { playlist: "Kids Karaoke", shuffle: true },
      fetchPlaylistSongs: mockFetcher(),
      log: vi.fn(),
      random: () => 0,
    });
    const session = makeSession();

    await autoplay.refillIfEmpty(session);

    expect(session.queue.map(i => i.mediaItem.title)).toEqual(
      shuffleArray(songs, () => 0).map(s => s.title)
    );
  });

  it("does not refill while songs are pending", async () => {
    const fetchPlaylistSongs = mockFetcher();
    const autoplay = createAutoplayPlaylist({
      config: { playlist: "Kids Karaoke", shuffle: false },
      fetchPlaylistSongs,
    });
    const session = makeSession({ queue: [makeQueueItem("pending", "A1")] });

    expect(await autoplay.refillIfEmpty(session)).toEqual([]);
    expect(fetchPlaylistSongs).not.toHaveBeenCalled();
    expect(session.queue).toHaveLength(1);
  });

  it("does not refill while a song is playing", async () => {
    const fetchPlaylistSongs = mockFetcher();
    const autoplay = createAutoplayPlaylist({
      config: { playlist: "Kids Karaoke", shuffle: false },
      fetchPlaylistSongs,
    });
    const playing = makeQueueItem("playing", "A1");
    const session = makeSession({ queue: [playing], currentSong: playing });

    expect(await autoplay.refillIfEmpty(session)).toEqual([]);
    expect(fetchPlaylistSongs).not.toHaveBeenCalled();
  });

  it("refills again once the queue has drained", async () => {
    const fetchPlaylistSongs = mockFetcher();
    const autoplay = createAutoplayPlaylist({
      config: { playlist: "Kids Karaoke", shuffle: false },
      fetchPlaylistSongs,
      log: vi.fn(),
    });
    const session = makeSession();

    await autoplay.refillIfEmpty(session);
    session.queue = []; // all songs completed and cleaned up
    const added = await autoplay.refillIfEmpty(session);

    expect(fetchPlaylistSongs).toHaveBeenCalledTimes(2);
    expect(added).toHaveLength(3);
  });

  it("shares a single fetch between concurrent refill calls", async () => {
    const fetchPlaylistSongs = mockFetcher();
    const autoplay = createAutoplayPlaylist({
      config: { playlist: "Kids Karaoke", shuffle: false },
      fetchPlaylistSongs,
      log: vi.fn(),
    });
    const session = makeSession();

    const [a, b] = await Promise.all([
      autoplay.refillIfEmpty(session),
      autoplay.refillIfEmpty(session),
    ]);

    expect(fetchPlaylistSongs).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
    expect(session.queue).toHaveLength(3);
  });

  it("keeps songs queued mid-fetch ahead of the playlist", async () => {
    const session = makeSession();
    const fetchPlaylistSongs = vi.fn(async () => {
      session.queue.push(makeQueueItem("pending", "Phone pick"));
      return { playlist: { name: "Kids Karaoke" }, songs };
    });
    const autoplay = createAutoplayPlaylist({
      config: { playlist: "Kids Karaoke", shuffle: false },
      fetchPlaylistSongs,
      log: vi.fn(),
    });

    await autoplay.refillIfEmpty(session);

    expect(session.queue[0].mediaItem.title).toBe("Phone pick");
    expect(session.queue.map(i => i.position)).toEqual([0, 1, 2, 3]);
  });

  it("logs and leaves the queue untouched when the playlist is empty", async () => {
    const log = vi.fn();
    const autoplay = createAutoplayPlaylist({
      config: { playlist: "Kids Karaoke", shuffle: false },
      fetchPlaylistSongs: mockFetcher({
        playlist: { name: "Kids Karaoke" },
        songs: [],
      }),
      log,
    });
    const session = makeSession();

    expect(await autoplay.refillIfEmpty(session)).toEqual([]);
    expect(session.queue).toEqual([]);
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("no playable songs")
    );
  });

  it("logs and recovers when the Jellyfin lookup fails", async () => {
    const log = vi.fn();
    const fetchPlaylistSongs = vi
      .fn()
      .mockRejectedValueOnce(new Error('playlist "Nope" not found'))
      .mockResolvedValueOnce({ playlist: { name: "Kids Karaoke" }, songs });
    const autoplay = createAutoplayPlaylist({
      config: { playlist: "Nope", shuffle: false },
      fetchPlaylistSongs,
      log,
    });
    const session = makeSession();

    expect(await autoplay.refillIfEmpty(session)).toEqual([]);
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("Failed to auto-queue"),
      expect.stringContaining("not found")
    );

    // A later attempt (e.g. after the playlist is created) succeeds
    expect(await autoplay.refillIfEmpty(session)).toHaveLength(3);
  });
});
