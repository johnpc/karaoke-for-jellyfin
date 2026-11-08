// Karaoke video discovery: KARAOKE_VIDEO_LIBRARY resolution + /Items fetch
import type { MediaItem } from "@/types";
import {
  buildVideoQueryParams,
  transformVideoItems,
  type VideoQueryOptions,
} from "./videoTransforms";
import { jellyfinAuthHeaders } from "./auth-header";

export type { VideoQueryOptions } from "./videoTransforms";

/** Minimal authenticated context (satisfied by both Jellyfin services) */
export interface VideoQueryContext {
  baseUrl: string;
  apiKey: string;
  userId: string;
}

export interface VideoQueryResult {
  items: MediaItem[];
  totalCount: number;
}

interface VirtualFolder {
  Name?: string | null;
  ItemId?: string | null;
}

/** KARAOKE_VIDEO_LIBRARY — library name or id; null when unset/blank */
export function getKaraokeVideoLibrarySetting(): string | null {
  const value = process.env.KARAOKE_VIDEO_LIBRARY?.trim();
  return value ? value : null;
}

/** Match a configured library by id first, then by name (case-insensitive) */
export function findLibraryId(
  folders: VirtualFolder[],
  setting: string
): string | null {
  const wanted = setting.toLowerCase();
  const byId = folders.find(f => f.ItemId?.toLowerCase() === wanted);
  const match = byId ?? folders.find(f => f.Name?.toLowerCase() === wanted);
  return match?.ItemId ?? null;
}

// undefined = not resolved yet; null = unset or not found
let cachedLibraryId: string | null | undefined;

export function resetVideoLibraryCache(): void {
  cachedLibraryId = undefined;
}

function authHeaders(apiKey: string): Record<string, string> {
  return { ...jellyfinAuthHeaders(apiKey), "Content-Type": "application/json" };
}

/**
 * Resolve KARAOKE_VIDEO_LIBRARY to a Jellyfin library id (cached).
 * A configured-but-missing library logs a warning and falls back to the
 * conservative MusicVideo-only behaviour rather than exposing every movie.
 */
export async function resolveVideoLibraryId(
  ctx: VideoQueryContext
): Promise<string | null> {
  const setting = getKaraokeVideoLibrarySetting();
  if (!setting) return null;
  if (cachedLibraryId !== undefined) return cachedLibraryId;

  try {
    const response = await fetch(`${ctx.baseUrl}/Library/VirtualFolders`, {
      headers: authHeaders(ctx.apiKey),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const folders: VirtualFolder[] = await response.json();
    cachedLibraryId = findLibraryId(folders, setting);
    if (cachedLibraryId) {
      console.log(`Karaoke video library "${setting}" -> ${cachedLibraryId}`);
    } else {
      console.warn(
        `KARAOKE_VIDEO_LIBRARY "${setting}" not found; including MusicVideo items only`
      );
    }
    return cachedLibraryId;
  } catch (error) {
    // Transient failure: don't cache, try again on the next request
    console.error("Failed to resolve KARAOKE_VIDEO_LIBRARY:", error);
    return null;
  }
}

/**
 * Fetch one page of karaoke videos matching the options.
 */
export async function fetchVideoItems(
  ctx: VideoQueryContext,
  options: VideoQueryOptions
): Promise<VideoQueryResult> {
  const libraryId = await resolveVideoLibraryId(ctx);
  const params = buildVideoQueryParams(options, ctx.userId, libraryId);

  const response = await fetch(`${ctx.baseUrl}/Items?${params}`, {
    headers: authHeaders(ctx.apiKey),
  });
  if (!response.ok) {
    throw new Error(`Video search failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  const items = transformVideoItems(data.Items || []);
  console.log(
    `Jellyfin returned ${items.length} karaoke videos (total: ${data.TotalRecordCount ?? 0})`
  );
  return { items, totalCount: data.TotalRecordCount || 0 };
}
