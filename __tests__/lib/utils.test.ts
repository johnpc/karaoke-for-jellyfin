import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMediaItem,
  formatMediaItemDisplay,
  searchMediaItems,
  createQueueItem,
  addToQueue,
  removeFromQueue,
  moveQueueItem,
  getNextSong,
  markSongAsPlaying,
  markSongAsCompleted,
  getUserQueueItems,
  createKaraokeSession,
  addUserToSession,
  removeUserFromSession,
  updateSessionActivity,
  createConnectedUser,
  updateUserLastSeen,
  findCurrentLyricsLine,
  formatLyricsTime,
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  formatTimeAgo,
  isRecentActivity,
  shuffleArray,
  groupBy,
  uniqueBy,
} from "@/lib/utils";
import { MediaItem, QueueItem, ConnectedUser, LyricsLine } from "@/types";

// ============================================================================
// TEST HELPERS
// ============================================================================

function makeMediaItem(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: "media_1",
    title: "Don't Stop Me Now",
    artist: "Queen",
    duration: 209,
    jellyfinId: "jf_001",
    streamUrl: "http://localhost:8096/stream/001",
    ...overrides,
  };
}

function makeQueueItem(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    id: "queue_1",
    mediaItem: makeMediaItem(),
    addedBy: "user_1",
    addedAt: new Date("2024-06-01T12:00:00Z"),
    position: 0,
    status: "pending",
    ...overrides,
  };
}

function makeConnectedUser(
  overrides: Partial<ConnectedUser> = {}
): ConnectedUser {
  return {
    id: "user_1",
    name: "Alice",
    isHost: true,
    connectedAt: new Date("2024-06-01T12:00:00Z"),
    lastSeen: new Date("2024-06-01T12:00:00Z"),
    ...overrides,
  };
}

// ============================================================================
// MEDIA ITEM UTILITIES
// ============================================================================

describe("createMediaItem", () => {
  it("should create a media item with generated id", () => {
    const item = createMediaItem({
      title: " Bohemian Rhapsody ",
      artist: " Queen ",
      jellyfinId: "jf_123",
      streamUrl: "http://localhost/stream",
      duration: 354,
    });

    expect(item.id).toMatch(/^media_\d+-[a-z0-9]+$/);
    expect(item.title).toBe("Bohemian Rhapsody");
    expect(item.artist).toBe("Queen");
    expect(item.jellyfinId).toBe("jf_123");
    expect(item.streamUrl).toBe("http://localhost/stream");
    expect(item.duration).toBe(354);
  });

  it("should trim album if provided", () => {
    const item = createMediaItem({
      title: "Test",
      artist: "Test",
      jellyfinId: "jf_1",
      streamUrl: "http://test.com",
      duration: 100,
      album: " A Night at the Opera ",
    });
    expect(item.album).toBe("A Night at the Opera");
  });

  it("should floor the duration", () => {
    const item = createMediaItem({
      title: "Test",
      artist: "Test",
      jellyfinId: "jf_1",
      streamUrl: "http://test.com",
      duration: 123.7,
    });
    expect(item.duration).toBe(123);
  });

  it("should clamp negative duration to 0", () => {
    const item = createMediaItem({
      title: "Test",
      artist: "Test",
      jellyfinId: "jf_1",
      streamUrl: "http://test.com",
      duration: -10,
    });
    expect(item.duration).toBe(0);
  });

  it("should include lyricsPath if provided", () => {
    const item = createMediaItem({
      title: "Test",
      artist: "Test",
      jellyfinId: "jf_1",
      streamUrl: "http://test.com",
      duration: 100,
      lyricsPath: "/lyrics/test.lrc",
    });
    expect(item.lyricsPath).toBe("/lyrics/test.lrc");
  });
});

describe("formatMediaItemDisplay", () => {
  it("should format without album", () => {
    const item = makeMediaItem();
    expect(formatMediaItemDisplay(item)).toBe(
      "Queen - Don't Stop Me Now [3:29]"
    );
  });

  it("should format with album", () => {
    const item = makeMediaItem({ album: "Jazz" });
    expect(formatMediaItemDisplay(item)).toBe(
      "Queen - Don't Stop Me Now (Jazz) [3:29]"
    );
  });

  it("should format zero duration", () => {
    const item = makeMediaItem({ duration: 0 });
    expect(formatMediaItemDisplay(item)).toBe(
      "Queen - Don't Stop Me Now [0:00]"
    );
  });
});

describe("searchMediaItems", () => {
  const items: MediaItem[] = [
    makeMediaItem({
      title: "Bohemian Rhapsody",
      artist: "Queen",
      album: "A Night at the Opera",
    }),
    makeMediaItem({
      id: "media_2",
      title: "Stairway to Heaven",
      artist: "Led Zeppelin",
    }),
    makeMediaItem({
      id: "media_3",
      title: "Hotel California",
      artist: "Eagles",
      album: "Hotel California",
    }),
  ];

  it("should return all items for empty query", () => {
    expect(searchMediaItems(items, "")).toEqual(items);
    expect(searchMediaItems(items, "   ")).toEqual(items);
  });

  it("should search by title (case-insensitive)", () => {
    const result = searchMediaItems(items, "bohemian");
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Bohemian Rhapsody");
  });

  it("should search by artist", () => {
    const result = searchMediaItems(items, "queen");
    expect(result).toHaveLength(1);
    expect(result[0].artist).toBe("Queen");
  });

  it("should search by album", () => {
    const result = searchMediaItems(items, "opera");
    expect(result).toHaveLength(1);
    expect(result[0].album).toBe("A Night at the Opera");
  });

  it("should return empty for no matches", () => {
    expect(searchMediaItems(items, "xyz")).toEqual([]);
  });

  it("should match multiple items", () => {
    const result = searchMediaItems(items, "hotel");
    expect(result).toHaveLength(1);
  });
});

// ============================================================================
// QUEUE UTILITIES
// ============================================================================

describe("createQueueItem", () => {
  it("should create a queue item with default position", () => {
    const media = makeMediaItem();
    const item = createQueueItem(media, " Alice ");

    expect(item.id).toMatch(/^queue_\d+-[a-z0-9]+$/);
    expect(item.mediaItem).toEqual(media);
    expect(item.addedBy).toBe("Alice");
    expect(item.addedAt).toBeInstanceOf(Date);
    expect(item.position).toBe(0);
    expect(item.status).toBe("pending");
  });

  it("should use provided position", () => {
    const item = createQueueItem(makeMediaItem(), "Bob", 5);
    expect(item.position).toBe(5);
  });
});

describe("addToQueue", () => {
  it("should add to end of empty queue", () => {
    const result = addToQueue([], makeMediaItem(), "Alice");
    expect(result).toHaveLength(1);
    expect(result[0].position).toBe(0);
    expect(result[0].addedBy).toBe("Alice");
  });

  it("should add to end of existing queue", () => {
    const existing = [makeQueueItem()];
    const result = addToQueue(
      existing,
      makeMediaItem({ id: "media_2" }),
      "Bob"
    );
    expect(result).toHaveLength(2);
    expect(result[0].position).toBe(0);
    expect(result[1].position).toBe(1);
  });

  it("should insert at specified position", () => {
    const existing = [
      makeQueueItem({ id: "q1", position: 0 }),
      makeQueueItem({ id: "q2", position: 1 }),
    ];
    const result = addToQueue(
      existing,
      makeMediaItem({ id: "media_new" }),
      "Charlie",
      1
    );
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("q1");
    expect(result[1].addedBy).toBe("Charlie");
    expect(result[2].id).toBe("q2");
    // All positions should be updated
    expect(result[0].position).toBe(0);
    expect(result[1].position).toBe(1);
    expect(result[2].position).toBe(2);
  });

  it("should not mutate original queue", () => {
    const original = [makeQueueItem()];
    addToQueue(original, makeMediaItem({ id: "media_2" }), "Bob");
    expect(original).toHaveLength(1);
  });
});

describe("removeFromQueue", () => {
  it("should remove item by id", () => {
    const queue = [
      makeQueueItem({ id: "q1", position: 0 }),
      makeQueueItem({ id: "q2", position: 1 }),
      makeQueueItem({ id: "q3", position: 2 }),
    ];
    const result = removeFromQueue(queue, "q2");
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("q1");
    expect(result[1].id).toBe("q3");
  });

  it("should update positions after removal", () => {
    const queue = [
      makeQueueItem({ id: "q1", position: 0 }),
      makeQueueItem({ id: "q2", position: 1 }),
      makeQueueItem({ id: "q3", position: 2 }),
    ];
    const result = removeFromQueue(queue, "q1");
    expect(result[0].position).toBe(0);
    expect(result[1].position).toBe(1);
  });

  it("should return same-length queue if id not found", () => {
    const queue = [makeQueueItem({ id: "q1" })];
    const result = removeFromQueue(queue, "nonexistent");
    expect(result).toHaveLength(1);
  });
});

describe("moveQueueItem", () => {
  it("should move item to new position", () => {
    const queue = [
      makeQueueItem({ id: "q1", position: 0 }),
      makeQueueItem({ id: "q2", position: 1 }),
      makeQueueItem({ id: "q3", position: 2 }),
    ];
    const result = moveQueueItem(queue, "q1", 2);
    expect(result[0].id).toBe("q2");
    expect(result[1].id).toBe("q3");
    expect(result[2].id).toBe("q1");
  });

  it("should update all positions", () => {
    const queue = [
      makeQueueItem({ id: "q1", position: 0 }),
      makeQueueItem({ id: "q2", position: 1 }),
    ];
    const result = moveQueueItem(queue, "q2", 0);
    expect(result[0].id).toBe("q2");
    expect(result[0].position).toBe(0);
    expect(result[1].id).toBe("q1");
    expect(result[1].position).toBe(1);
  });

  it("should return original queue if item not found", () => {
    const queue = [makeQueueItem({ id: "q1" })];
    const result = moveQueueItem(queue, "nonexistent", 0);
    expect(result).toEqual(queue);
  });
});

describe("getNextSong", () => {
  it("should return first pending song", () => {
    const queue = [
      makeQueueItem({ id: "q1", status: "completed" }),
      makeQueueItem({ id: "q2", status: "pending" }),
      makeQueueItem({ id: "q3", status: "pending" }),
    ];
    const next = getNextSong(queue);
    expect(next).not.toBeNull();
    expect(next!.id).toBe("q2");
  });

  it("should return null if no pending songs", () => {
    const queue = [
      makeQueueItem({ id: "q1", status: "completed" }),
      makeQueueItem({ id: "q2", status: "playing" }),
    ];
    expect(getNextSong(queue)).toBeNull();
  });

  it("should return null for empty queue", () => {
    expect(getNextSong([])).toBeNull();
  });
});

describe("markSongAsPlaying", () => {
  it("should mark the specified song as playing", () => {
    const queue = [
      makeQueueItem({ id: "q1", status: "pending" }),
      makeQueueItem({ id: "q2", status: "pending" }),
    ];
    const result = markSongAsPlaying(queue, "q1");
    expect(result[0].status).toBe("playing");
    expect(result[1].status).toBe("pending");
  });

  it("should not change status of other items", () => {
    const queue = [
      makeQueueItem({ id: "q1", status: "completed" }),
      makeQueueItem({ id: "q2", status: "pending" }),
    ];
    const result = markSongAsPlaying(queue, "q2");
    expect(result[0].status).toBe("completed");
    expect(result[1].status).toBe("playing");
  });
});

describe("markSongAsCompleted", () => {
  it("should mark the specified song as completed", () => {
    const queue = [
      makeQueueItem({ id: "q1", status: "playing" }),
      makeQueueItem({ id: "q2", status: "pending" }),
    ];
    const result = markSongAsCompleted(queue, "q1");
    expect(result[0].status).toBe("completed");
    expect(result[1].status).toBe("pending");
  });
});

describe("getUserQueueItems", () => {
  it("should return only items added by specified user", () => {
    const queue = [
      makeQueueItem({ id: "q1", addedBy: "Alice" }),
      makeQueueItem({ id: "q2", addedBy: "Bob" }),
      makeQueueItem({ id: "q3", addedBy: "Alice" }),
    ];
    const result = getUserQueueItems(queue, "Alice");
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("q1");
    expect(result[1].id).toBe("q3");
  });

  it("should return empty array if user has no items", () => {
    const queue = [makeQueueItem({ addedBy: "Alice" })];
    expect(getUserQueueItems(queue, "Charlie")).toEqual([]);
  });
});

// ============================================================================
// SESSION UTILITIES
// ============================================================================

describe("createKaraokeSession", () => {
  it("should create a session with correct defaults", () => {
    const host = makeConnectedUser();
    const session = createKaraokeSession(" Party Night ", host);

    expect(session.id).toMatch(/^session_\d+-[a-z0-9]+$/);
    expect(session.name).toBe("Party Night");
    expect(session.queue).toEqual([]);
    expect(session.currentSong).toBeNull();
    expect(session.playbackState.isPlaying).toBe(false);
    expect(session.playbackState.volume).toBe(80);
    expect(session.playbackState.isMuted).toBe(false);
    expect(session.playbackState.playbackRate).toBe(1.0);
    expect(session.playbackState.lyricsOffset).toBe(0);
    expect(session.connectedUsers).toHaveLength(1);
    expect(session.connectedUsers[0]).toEqual(host);
    expect(session.hostControls.autoAdvance).toBe(true);
    expect(session.hostControls.allowUserSkip).toBe(false);
    expect(session.hostControls.maxSongsPerUser).toBe(5);
    expect(session.settings.displayName).toBe("Party Night");
    expect(session.settings.isPublic).toBe(false);
    expect(session.settings.maxUsers).toBe(50);
    expect(session.settings.lyricsEnabled).toBe(true);
    expect(session.createdAt).toBeInstanceOf(Date);
    expect(session.lastActivity).toBeInstanceOf(Date);
  });
});

describe("addUserToSession", () => {
  it("should add a new user", () => {
    const host = makeConnectedUser({ id: "host_1", name: "Host" });
    const session = createKaraokeSession("Test", host);
    const newUser = makeConnectedUser({
      id: "user_2",
      name: "Bob",
      isHost: false,
    });

    const updated = addUserToSession(session, newUser);
    expect(updated.connectedUsers).toHaveLength(2);
    expect(updated.connectedUsers[1].name).toBe("Bob");
    expect(updated.lastActivity).toBeInstanceOf(Date);
  });

  it("should update existing user if already in session", () => {
    const host = makeConnectedUser({ id: "host_1" });
    const session = createKaraokeSession("Test", host);

    const updatedHost = { ...host, name: "Updated Host" };
    const updated = addUserToSession(session, updatedHost);

    expect(updated.connectedUsers).toHaveLength(1);
    expect(updated.connectedUsers[0].name).toBe("Updated Host");
  });
});

describe("removeUserFromSession", () => {
  it("should remove user by id", () => {
    const host = makeConnectedUser({ id: "host_1" });
    const session = createKaraokeSession("Test", host);
    const user2 = makeConnectedUser({
      id: "user_2",
      name: "Bob",
      isHost: false,
    });
    const withUser = addUserToSession(session, user2);

    const updated = removeUserFromSession(withUser, "user_2");
    expect(updated.connectedUsers).toHaveLength(1);
    expect(updated.connectedUsers[0].id).toBe("host_1");
  });

  it("should not fail if user not found", () => {
    const host = makeConnectedUser({ id: "host_1" });
    const session = createKaraokeSession("Test", host);
    const updated = removeUserFromSession(session, "nonexistent");
    expect(updated.connectedUsers).toHaveLength(1);
  });
});

describe("updateSessionActivity", () => {
  it("should update lastActivity timestamp", () => {
    const host = makeConnectedUser();
    const session = createKaraokeSession("Test", host);
    const oldActivity = session.lastActivity;

    // Small delay to ensure different timestamp
    const updated = updateSessionActivity(session);
    expect(updated.lastActivity).toBeInstanceOf(Date);
    expect(updated.lastActivity.getTime()).toBeGreaterThanOrEqual(
      oldActivity.getTime()
    );
  });
});

// ============================================================================
// USER UTILITIES
// ============================================================================

describe("createConnectedUser", () => {
  it("should create user with defaults", () => {
    const user = createConnectedUser(" Alice ");
    expect(user.id).toMatch(/^user_\d+-[a-z0-9]+$/);
    expect(user.name).toBe("Alice");
    expect(user.isHost).toBe(false);
    expect(user.connectedAt).toBeInstanceOf(Date);
    expect(user.lastSeen).toBeInstanceOf(Date);
    expect(user.socketId).toBeUndefined();
  });

  it("should create host user", () => {
    const user = createConnectedUser("Host", true);
    expect(user.isHost).toBe(true);
  });

  it("should include socketId if provided", () => {
    const user = createConnectedUser("Bob", false, "sock_123");
    expect(user.socketId).toBe("sock_123");
  });
});

describe("updateUserLastSeen", () => {
  it("should update lastSeen timestamp", () => {
    const user = makeConnectedUser({
      lastSeen: new Date("2024-01-01T00:00:00Z"),
    });
    const updated = updateUserLastSeen(user);
    expect(updated.lastSeen.getTime()).toBeGreaterThan(user.lastSeen.getTime());
    // Other fields unchanged
    expect(updated.id).toBe(user.id);
    expect(updated.name).toBe(user.name);
  });
});

// ============================================================================
// LYRICS UTILITIES
// ============================================================================

describe("findCurrentLyricsLine", () => {
  const lines: LyricsLine[] = [
    { timestamp: 0, text: "Line 1" },
    { timestamp: 5000, text: "Line 2" },
    { timestamp: 10000, text: "Line 3" },
    { timestamp: 15000, text: "Line 4" },
  ];

  it("should return null for empty lines", () => {
    const result = findCurrentLyricsLine([], 5);
    expect(result.current).toBeNull();
    expect(result.next).toBeNull();
    expect(result.index).toBe(-1);
  });

  it("should return first line when time is at start", () => {
    // currentTime is in seconds, timestamps in ms
    const result = findCurrentLyricsLine(lines, 0);
    expect(result.current!.text).toBe("Line 1");
    expect(result.next!.text).toBe("Line 2");
    expect(result.index).toBe(0);
  });

  it("should return correct line for mid-song time", () => {
    const result = findCurrentLyricsLine(lines, 7);
    // 7 seconds = 7000ms, which is after timestamp 5000 but before 10000
    expect(result.current!.text).toBe("Line 2");
    expect(result.next!.text).toBe("Line 3");
    expect(result.index).toBe(1);
  });

  it("should return last line with no next when at end", () => {
    const result = findCurrentLyricsLine(lines, 20);
    expect(result.current!.text).toBe("Line 4");
    expect(result.next).toBeNull();
    expect(result.index).toBe(3);
  });

  it("should return null current if time is before first timestamp", () => {
    const linesStartingLater: LyricsLine[] = [
      { timestamp: 5000, text: "First" },
      { timestamp: 10000, text: "Second" },
    ];
    // 2 seconds = 2000ms, before 5000ms
    const result = findCurrentLyricsLine(linesStartingLater, 2);
    expect(result.current).toBeNull();
    expect(result.next).toBeNull();
    expect(result.index).toBe(-1);
  });
});

describe("formatLyricsTime", () => {
  it("should format milliseconds to mm:ss.ms", () => {
    expect(formatLyricsTime(0)).toBe("00:00.00");
    expect(formatLyricsTime(5000)).toBe("00:05.00");
    expect(formatLyricsTime(65000)).toBe("01:05.00");
    expect(formatLyricsTime(125500)).toBe("02:05.50");
  });

  it("should handle sub-second precision", () => {
    expect(formatLyricsTime(1230)).toBe("00:01.23");
    expect(formatLyricsTime(999)).toBe("00:00.99");
  });
});

// ============================================================================
// API RESPONSE UTILITIES
// ============================================================================

describe("createSuccessResponse", () => {
  it("should create a success response", () => {
    const data = { id: "123", name: "test" };
    const response = createSuccessResponse(data);
    expect(response.success).toBe(true);
    expect(response.data).toEqual(data);
    expect(response.timestamp).toBeInstanceOf(Date);
  });

  it("should work with array data", () => {
    const response = createSuccessResponse([1, 2, 3]);
    expect(response.success).toBe(true);
    expect(response.data).toEqual([1, 2, 3]);
  });

  it("should work with null data", () => {
    const response = createSuccessResponse(null);
    expect(response.success).toBe(true);
    expect(response.data).toBeNull();
  });
});

describe("createErrorResponse", () => {
  it("should create an error response", () => {
    const response = createErrorResponse("NOT_FOUND", "Item not found");
    expect(response.success).toBe(false);
    expect(response.error!.code).toBe("NOT_FOUND");
    expect(response.error!.message).toBe("Item not found");
    expect(response.error!.details).toBeUndefined();
    expect(response.timestamp).toBeInstanceOf(Date);
  });

  it("should include details if provided", () => {
    const response = createErrorResponse("INVALID", "Bad input", {
      field: "name",
    });
    expect(response.error!.details).toEqual({ field: "name" });
  });
});

describe("createPaginatedResponse", () => {
  it("should create paginated response with correct metadata", () => {
    const data = ["a", "b", "c"];
    const response = createPaginatedResponse(data, 1, 10, 25);
    expect(response.success).toBe(true);
    expect(response.data).toEqual(data);
    expect(response.pagination.page).toBe(1);
    expect(response.pagination.limit).toBe(10);
    expect(response.pagination.total).toBe(25);
    expect(response.pagination.hasNext).toBe(true);
    expect(response.pagination.hasPrev).toBe(false);
  });

  it("should set hasNext false on last page", () => {
    const response = createPaginatedResponse(["x"], 3, 10, 25);
    // page 3, limit 10: 3*10=30 >= 25, so hasNext = false
    expect(response.pagination.hasNext).toBe(false);
  });

  it("should set hasPrev true when page > 1", () => {
    const response = createPaginatedResponse([], 2, 10, 25);
    expect(response.pagination.hasPrev).toBe(true);
  });

  it("should set hasPrev false for page 1", () => {
    const response = createPaginatedResponse([], 1, 10, 25);
    expect(response.pagination.hasPrev).toBe(false);
  });
});

// ============================================================================
// TIME UTILITIES
// ============================================================================

describe("formatTimeAgo", () => {
  it("should return 'just now' for recent timestamps", () => {
    const now = new Date();
    expect(formatTimeAgo(now)).toBe("just now");
  });

  it("should format minutes ago", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatTimeAgo(fiveMinAgo)).toBe("5m ago");
  });

  it("should format hours ago", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(formatTimeAgo(twoHoursAgo)).toBe("2h ago");
  });

  it("should format days ago", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(formatTimeAgo(threeDaysAgo)).toBe("3d ago");
  });

  it("should format as date for 7+ days", () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const result = formatTimeAgo(twoWeeksAgo);
    // Should be a locale date string, not "Xd ago"
    expect(result).not.toContain("ago");
  });
});

describe("isRecentActivity", () => {
  it("should return true for activity within threshold", () => {
    const now = new Date();
    expect(isRecentActivity(now)).toBe(true);
  });

  it("should return true for activity just within threshold", () => {
    const fourMinAgo = new Date(Date.now() - 4 * 60 * 1000);
    expect(isRecentActivity(fourMinAgo)).toBe(true);
  });

  it("should return false for activity beyond threshold", () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    expect(isRecentActivity(tenMinAgo)).toBe(false);
  });

  it("should respect custom threshold", () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    expect(isRecentActivity(tenMinAgo, 15)).toBe(true);
    expect(isRecentActivity(tenMinAgo, 5)).toBe(false);
  });
});

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

describe("shuffleArray", () => {
  it("should return array of same length", () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    expect(shuffled).toHaveLength(5);
  });

  it("should contain same elements", () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    expect(shuffled.sort()).toEqual(arr.sort());
  });

  it("should not mutate original array", () => {
    const arr = [1, 2, 3, 4, 5];
    const original = [...arr];
    shuffleArray(arr);
    expect(arr).toEqual(original);
  });

  it("should handle empty array", () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it("should handle single element", () => {
    expect(shuffleArray([42])).toEqual([42]);
  });
});

describe("groupBy", () => {
  it("should group items by key function", () => {
    const items = [
      { name: "Alice", role: "admin" },
      { name: "Bob", role: "user" },
      { name: "Charlie", role: "admin" },
    ];
    const grouped = groupBy(items, item => item.role);
    expect(grouped["admin"]).toHaveLength(2);
    expect(grouped["user"]).toHaveLength(1);
    expect(grouped["admin"][0].name).toBe("Alice");
    expect(grouped["admin"][1].name).toBe("Charlie");
  });

  it("should handle empty array", () => {
    const result = groupBy([], () => "key");
    expect(result).toEqual({});
  });

  it("should work with numeric keys", () => {
    const items = [1, 2, 3, 4, 5, 6];
    const grouped = groupBy(items, n => (n % 2 === 0 ? 0 : 1));
    expect(grouped[0]).toEqual([2, 4, 6]);
    expect(grouped[1]).toEqual([1, 3, 5]);
  });
});

describe("uniqueBy", () => {
  it("should remove duplicates by key function", () => {
    const items = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
      { id: 1, name: "Alice2" },
    ];
    const result = uniqueBy(items, item => item.id);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Alice");
    expect(result[1].name).toBe("Bob");
  });

  it("should keep first occurrence", () => {
    const items = [
      { id: "a", value: 1 },
      { id: "a", value: 2 },
      { id: "a", value: 3 },
    ];
    const result = uniqueBy(items, item => item.id);
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(1);
  });

  it("should handle empty array", () => {
    expect(uniqueBy([], x => x)).toEqual([]);
  });

  it("should handle all unique items", () => {
    const items = [1, 2, 3];
    expect(uniqueBy(items, x => x)).toEqual([1, 2, 3]);
  });
});
