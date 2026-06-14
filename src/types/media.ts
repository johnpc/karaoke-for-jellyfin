// Media types — songs, artists, albums, playlists, and metadata

export interface MediaItem {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  jellyfinId: string;
  streamUrl: string;
  lyricsPath?: string;
  hasLyrics?: boolean; // From Jellyfin's HasLyrics field
  metadata?: MediaMetadata;
}

export interface Artist {
  id: string;
  name: string;
  jellyfinId: string;
  imageUrl?: string;
  songCount?: number;
}

export interface Album {
  id: string;
  name: string;
  artist: string;
  jellyfinId: string;
  imageUrl?: string;
  trackCount?: number;
  year?: number;
  genre?: string;
}

export interface Playlist {
  id: string;
  name: string;
  jellyfinId: string;
  imageUrl?: string;
  trackCount?: number;
  description?: string;
  createdBy?: string;
  createdAt?: Date;
}

export interface MediaMetadata {
  genre?: string;
  year?: number;
  trackNumber?: number;
  discNumber?: number;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  fileSize?: number;
  format?: string;
}

// Lyrics types

export interface LyricsLine {
  timestamp: number; // milliseconds from start
  text: string;
  duration?: number; // milliseconds
  isChorus?: boolean;
  isVerse?: boolean;
}

export interface LyricsFile {
  songId: string;
  lines: LyricsLine[];
  format: LyricsFormat;
  metadata?: LyricsMetadata;
}

export interface LyricsMetadata {
  title?: string;
  artist?: string;
  album?: string;
  length?: number;
  offset?: number; // global timing offset in milliseconds
  creator?: string;
  version?: string;
}

export type LyricsFormat = "lrc" | "srt" | "txt" | "vtt";

export interface LyricsSyncState {
  currentLine: number;
  currentTimestamp: number;
  isActive: boolean;
  nextLine?: LyricsLine;
}
