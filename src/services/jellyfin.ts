// Re-export from modular jellyfin service
// This file exists for backwards compatibility with imports from "@/services/jellyfin"
export { JellyfinService, getJellyfinService } from "./jellyfin/index";

export type {
  JellyfinAuthResponse,
  JellyfinMediaItem,
  JellyfinArtist,
  JellyfinAlbum,
  JellyfinSearchResponse,
  JellyfinArtistSearchResponse,
  JellyfinAlbumSearchResponse,
  JellyfinContext,
} from "./jellyfin/index";
