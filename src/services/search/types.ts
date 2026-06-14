import { MediaItem, Artist, Album, Playlist } from "@/types";

export interface SearchOptions {
  query: string;
  page?: number;
  limit?: number;
  startIndex?: number;
}

export interface SearchResults {
  artists: Artist[];
  albums: Album[];
  songs: MediaItem[];
  hasMore: boolean;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  error?: string;
}

// Re-export types used by consumers
export type { MediaItem, Artist, Album, Playlist };
