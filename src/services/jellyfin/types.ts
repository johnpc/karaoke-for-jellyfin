// Jellyfin API response types

export interface JellyfinAuthResponse {
  AccessToken: string;
  ServerId: string;
  User: {
    Id: string;
    Name: string;
  };
}

export interface JellyfinMediaItem {
  Id: string;
  Name: string;
  Artists?: string[];
  Album?: string;
  RunTimeTicks?: number;
  MediaType: string;
  Type: string;
  HasLyrics?: boolean;
  UserData?: {
    PlaybackPositionTicks: number;
  };
}

export interface JellyfinArtist {
  Id: string;
  Name: string;
  Type: string;
  Overview?: string;
  ImageTags?: {
    Primary?: string;
  };
}

export interface JellyfinAlbum {
  Id: string;
  Name: string;
  Type: string;
  Artists?: string[];
  ProductionYear?: number;
  Genres?: string[];
  ImageTags?: {
    Primary?: string;
  };
  ChildCount?: number;
}

export interface JellyfinSearchResponse {
  Items: JellyfinMediaItem[];
  TotalRecordCount: number;
}

export interface JellyfinArtistSearchResponse {
  Items: JellyfinArtist[];
  TotalRecordCount: number;
}

export interface JellyfinAlbumSearchResponse {
  Items: JellyfinAlbum[];
  TotalRecordCount: number;
}

/**
 * Shared context passed to all Jellyfin service modules.
 * Provides authenticated access to the Jellyfin API.
 */
export interface JellyfinContext {
  baseUrl: string;
  apiKey: string;
  userId: string;
}
