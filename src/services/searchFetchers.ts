import { MediaItem, Artist, Playlist } from "@/types";

export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T[];
  error?: { message?: string };
}

/**
 * Generic paginated fetch helper. Computes startIndex from page,
 * appends limit/startIndex query params, and returns { data, hasMore }.
 */
export async function fetchPaginated<T>(
  url: string,
  page: number,
  limit = 50
): Promise<PaginatedResult<T>> {
  const startIndex = (page - 1) * limit;
  const separator = url.includes("?") ? "&" : "?";
  const fullUrl = `${url}${separator}limit=${limit}&startIndex=${startIndex}`;

  const response = await fetch(fullUrl);
  const json: ApiResponse<T> = await response.json();

  if (json.success) {
    const items: T[] = json.data || [];
    return {
      data: items,
      hasMore: items.length === limit,
    };
  }

  const errorMsg = json.error?.message || "Request failed";
  throw new Error(errorMsg);
}

/**
 * Fetch songs belonging to a specific album.
 */
export async function fetchSongsByAlbum(
  albumId: string,
  page: number
): Promise<PaginatedResult<MediaItem>> {
  return fetchPaginated<MediaItem>(`/api/albums/${albumId}/songs`, page);
}

/**
 * Fetch songs belonging to a specific artist.
 */
export async function fetchSongsByArtist(
  artistId: string,
  page: number
): Promise<PaginatedResult<MediaItem>> {
  return fetchPaginated<MediaItem>(`/api/artists/${artistId}/songs`, page);
}

/**
 * Fetch paginated list of playlists.
 */
export async function fetchPlaylists(
  page: number
): Promise<PaginatedResult<Playlist>> {
  return fetchPaginated<Playlist>("/api/playlists", page);
}

/**
 * Fetch songs belonging to a specific playlist.
 */
export async function fetchSongsByPlaylist(
  playlistId: string,
  page: number
): Promise<PaginatedResult<MediaItem>> {
  return fetchPaginated<MediaItem>(`/api/playlists/${playlistId}/items`, page);
}

/**
 * Fetch paginated list of artists (browse mode, no search query).
 */
export async function fetchArtists(
  page: number
): Promise<PaginatedResult<Artist>> {
  return fetchPaginated<Artist>("/api/artists", page);
}
