// Utility functions for data transformation and manipulation
import {
  MediaItem,
  QueueItem,
  KaraokeSession,
  ConnectedUser,
  LyricsLine,
  PlaybackState,
  QueueItemStatus,
  ApiResponse,
  PaginatedResponse,
} from "@/types";
import { generateId, formatDuration } from "./validation";

// ============================================================================
// MEDIA ITEM UTILITIES
// ============================================================================

export function createMediaItem(data: {
  title: string;
  artist: string;
  jellyfinId: string;
  streamUrl: string;
  duration: number;
  album?: string;
  lyricsPath?: string;
}): MediaItem {
  return {
    id: `media_${generateId()}`,
    title: data.title.trim(),
    artist: data.artist.trim(),
    album: data.album?.trim(),
    duration: Math.max(0, Math.floor(data.duration)),
    jellyfinId: data.jellyfinId,
    streamUrl: data.streamUrl,
    lyricsPath: data.lyricsPath,
  };
}

export function formatMediaItemDisplay(item: MediaItem): string {
  const duration = formatDuration(item.duration);
  const album = item.album ? ` (${item.album})` : "";
  return `${item.artist} - ${item.title}${album} [${duration}]`;
}

export function searchMediaItems(
  items: MediaItem[],
  query: string
): MediaItem[] {
  if (!query.trim()) return items;

  const searchTerm = query.toLowerCase().trim();

  return items.filter(
    item =>
      item.title.toLowerCase().includes(searchTerm) ||
      item.artist.toLowerCase().includes(searchTerm) ||
      (item.album && item.album.toLowerCase().includes(searchTerm))
  );
}

// ============================================================================
// QUEUE UTILITIES
// ============================================================================

export function createQueueItem(
  mediaItem: MediaItem,
  addedBy: string,
  position?: number
): QueueItem {
  return {
    id: `queue_${generateId()}`,
    mediaItem,
    addedBy: addedBy.trim(),
    addedAt: new Date(),
    position: position ?? 0,
    status: "pending" as QueueItemStatus,
  };
}

export function addToQueue(
  queue: QueueItem[],
  mediaItem: MediaItem,
  addedBy: string,
  position?: number
): QueueItem[] {
  const newQueue = [...queue];
  const insertPosition = position ?? newQueue.length;

  const queueItem = createQueueItem(mediaItem, addedBy, insertPosition);

  // Insert at specified position
  newQueue.splice(insertPosition, 0, queueItem);

  // Update positions for all items
  return newQueue.map((item, index) => ({
    ...item,
    position: index,
  }));
}

export function removeFromQueue(
  queue: QueueItem[],
  itemId: string
): QueueItem[] {
  const newQueue = queue.filter(item => item.id !== itemId);

  // Update positions
  return newQueue.map((item, index) => ({
    ...item,
    position: index,
  }));
}

export function moveQueueItem(
  queue: QueueItem[],
  itemId: string,
  newPosition: number
): QueueItem[] {
  const currentIndex = queue.findIndex(item => item.id === itemId);
  if (currentIndex === -1) return queue;

  const newQueue = [...queue];
  const [movedItem] = newQueue.splice(currentIndex, 1);
  newQueue.splice(newPosition, 0, movedItem);

  // Update positions
  return newQueue.map((item, index) => ({
    ...item,
    position: index,
  }));
}

export function getNextSong(queue: QueueItem[]): QueueItem | null {
  const pendingSongs = queue.filter(item => item.status === "pending");
  return pendingSongs.length > 0 ? pendingSongs[0] : null;
}

export function markSongAsPlaying(
  queue: QueueItem[],
  songId: string
): QueueItem[] {
  return queue.map(item => ({
    ...item,
    status: item.id === songId ? ("playing" as QueueItemStatus) : item.status,
  }));
}

export function markSongAsCompleted(
  queue: QueueItem[],
  songId: string
): QueueItem[] {
  return queue.map(item => ({
    ...item,
    status: item.id === songId ? ("completed" as QueueItemStatus) : item.status,
  }));
}

export function getUserQueueItems(
  queue: QueueItem[],
  userId: string
): QueueItem[] {
  return queue.filter(item => item.addedBy === userId);
}

// ============================================================================
// SESSION UTILITIES
// ============================================================================

export function createKaraokeSession(
  name: string,
  hostUser: ConnectedUser
): KaraokeSession {
  return {
    id: `session_${generateId()}`,
    name: name.trim(),
    queue: [],
    currentSong: null,
    playbackState: {
      isPlaying: false,
      currentTime: 0,
      volume: 80,
      isMuted: false,
      playbackRate: 1.0,
      lyricsOffset: 0,
    },
    connectedUsers: [hostUser],
    hostControls: {
      autoAdvance: true,
      allowUserSkip: false,
      allowUserRemove: true,
      maxSongsPerUser: 5,
      requireApproval: false,
    },
    settings: {
      displayName: name.trim(),
      isPublic: false,
      maxUsers: 50,
      lyricsEnabled: true,
      crossfadeEnabled: false,
      crossfadeDuration: 3,
    },
    createdAt: new Date(),
    lastActivity: new Date(),
  };
}

export function addUserToSession(
  session: KaraokeSession,
  user: ConnectedUser
): KaraokeSession {
  // Check if user already exists
  const existingUserIndex = session.connectedUsers.findIndex(
    u => u.id === user.id
  );

  if (existingUserIndex >= 0) {
    // Update existing user
    const updatedUsers = [...session.connectedUsers];
    updatedUsers[existingUserIndex] = { ...user, lastSeen: new Date() };

    return {
      ...session,
      connectedUsers: updatedUsers,
      lastActivity: new Date(),
    };
  }

  // Add new user
  return {
    ...session,
    connectedUsers: [...session.connectedUsers, user],
    lastActivity: new Date(),
  };
}

export function removeUserFromSession(
  session: KaraokeSession,
  userId: string
): KaraokeSession {
  return {
    ...session,
    connectedUsers: session.connectedUsers.filter(user => user.id !== userId),
    lastActivity: new Date(),
  };
}

export function updateSessionActivity(session: KaraokeSession): KaraokeSession {
  return {
    ...session,
    lastActivity: new Date(),
  };
}

// ============================================================================
// USER UTILITIES
// ============================================================================

export function createConnectedUser(
  name: string,
  isHost: boolean = false,
  socketId?: string
): ConnectedUser {
  const now = new Date();

  return {
    id: `user_${generateId()}`,
    name: name.trim(),
    isHost,
    connectedAt: now,
    lastSeen: now,
    socketId,
  };
}

export function updateUserLastSeen(user: ConnectedUser): ConnectedUser {
  return {
    ...user,
    lastSeen: new Date(),
  };
}

// ============================================================================
// LYRICS UTILITIES
// ============================================================================

export function findCurrentLyricsLine(
  lines: LyricsLine[],
  currentTime: number
): { current: LyricsLine | null; next: LyricsLine | null; index: number } {
  if (!lines.length) {
    return { current: null, next: null, index: -1 };
  }

  const currentTimeMs = currentTime * 1000;

  // Find the current line (last line with timestamp <= currentTime)
  let currentIndex = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].timestamp <= currentTimeMs) {
      currentIndex = i;
      break;
    }
  }

  const current = currentIndex >= 0 ? lines[currentIndex] : null;
  const next =
    currentIndex >= 0 && currentIndex < lines.length - 1
      ? lines[currentIndex + 1]
      : null;

  return { current, next, index: currentIndex };
}

export function formatLyricsTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const ms = Math.floor((milliseconds % 1000) / 10);

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}

// ============================================================================
// API RESPONSE UTILITIES
// ============================================================================

export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date(),
  };
}

export function createErrorResponse(
  code: string,
  message: string,
  details?: any
): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date(),
    },
    timestamp: new Date(),
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
    timestamp: new Date(),
  };
}

// ============================================================================
// TIME UTILITIES
// ============================================================================

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export function isRecentActivity(
  date: Date,
  thresholdMinutes: number = 5
): boolean {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  return diffMinutes <= thresholdMinutes;
}

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function groupBy<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce(
    (groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    },
    {} as Record<K, T[]>
  );
}

export function uniqueBy<T>(array: T[], keyFn: (item: T) => any): T[] {
  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
