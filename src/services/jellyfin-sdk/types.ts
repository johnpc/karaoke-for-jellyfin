// Shared types and configuration for the Jellyfin SDK service
import { Api } from "@jellyfin/sdk";

/**
 * Shared connection context passed to all SDK sub-modules
 */
export interface JellyfinContext {
  api: Api;
  baseUrl: string;
  apiKey: string;
  userId: string;
}

/**
 * Response shape for paginated song queries
 */
export interface SongResult {
  songs: import("@/types").MediaItem[];
  totalCount: number;
}
