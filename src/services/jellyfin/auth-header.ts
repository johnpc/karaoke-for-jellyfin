/**
 * Jellyfin authentication headers.
 *
 * Jellyfin 12 removed the legacy `X-Emby-Token` header and `api_key` query
 * parameter; only the `Authorization: MediaBrowser ...` scheme is accepted.
 * Older servers (10.x) accept this scheme as well, so it is used everywhere.
 */
export const JELLYFIN_CLIENT_NAME = "Karaoke For Jellyfin";
export const JELLYFIN_DEVICE_ID = "karaoke-for-jellyfin";

export function jellyfinAuthHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization:
      `MediaBrowser Client="${JELLYFIN_CLIENT_NAME}", Device="Server", ` +
      `DeviceId="${JELLYFIN_DEVICE_ID}", Version="1.0.0", Token="${apiKey}"`,
  };
}

/** Auth header plus the JSON content type used by every Jellyfin API call. */
export function jellyfinJsonHeaders(apiKey: string): Record<string, string> {
  return { ...jellyfinAuthHeaders(apiKey), "Content-Type": "application/json" };
}
