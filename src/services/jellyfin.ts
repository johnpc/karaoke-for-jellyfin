// Jellyfin API integration service
import { MediaItem } from "@/types";

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

export interface JellyfinSearchResponse {
  Items: JellyfinMediaItem[];
  TotalRecordCount: number;
}

export interface JellyfinArtistSearchResponse {
  Items: JellyfinArtist[];
  TotalRecordCount: number;
}

export interface Artist {
  id: string;
  name: string;
  jellyfinId: string;
  imageUrl?: string;
  songCount?: number;
}

export class JellyfinService {
  private baseUrl: string;
  private apiKey: string;
  private username: string;
  private userId: string | null = null;
  private artistSearchCache: Map<string, MediaItem[]> | null = null;

  constructor() {
    this.baseUrl = process.env.JELLYFIN_SERVER_URL?.replace(/\/$/, "") || "";
    this.apiKey = process.env.JELLYFIN_API_KEY || "";
    this.username = process.env.JELLYFIN_USERNAME || "";

    if (!this.baseUrl || !this.apiKey || !this.username) {
      throw new Error(
        "JELLYFIN_SERVER_URL, JELLYFIN_API_KEY, and JELLYFIN_USERNAME must be configured",
      );
    }
  }

  /**
   * Authenticate with Jellyfin using API key and find user by username
   */
  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/Users`, {
        headers: {
          "X-Emby-Token": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const users = await response.json();
      console.log(
        "Available users:",
        users?.map((u: any) => u.Name),
      );

      if (users && users.length > 0) {
        // Find user by username (case insensitive)
        const targetUser = users.find(
          (user: any) =>
            user.Name?.toLowerCase() === this.username.toLowerCase(),
        );

        if (targetUser) {
          this.userId = targetUser.Id;
          console.log(
            `Authenticated as user: ${targetUser.Name} (ID: ${targetUser.Id})`,
          );
          return true;
        } else {
          console.error(
            `User "${this.username}" not found. Available users:`,
            users.map((u: any) => u.Name),
          );
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error("Jellyfin authentication error:", error);
      return false;
    }
  }

  /**
   * Search for audio items in Jellyfin library
   * Searches both song titles and artist names
   */
  async searchMedia(query: string, limit: number = 50): Promise<MediaItem[]> {
    if (!this.userId) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error("Failed to authenticate with Jellyfin");
      }
    }

    try {
      // Perform multiple searches to cover both titles and artists
      const searchPromises = [
        // Search by song title
        this.performSearch(query, limit, "Name"),
        // Search by artist name
        this.performSearch(query, limit, "Artists"),
      ];

      const searchResults = await Promise.all(searchPromises);
      
      // Combine and deduplicate results
      const allResults = searchResults.flat();
      const uniqueResults = new Map<string, MediaItem>();
      
      // Use Map to deduplicate by ID, keeping the first occurrence
      allResults.forEach(item => {
        if (!uniqueResults.has(item.id)) {
          uniqueResults.set(item.id, item);
        }
      });

      // Convert back to array and limit results
      const finalResults = Array.from(uniqueResults.values());
      
      // Sort results by relevance (exact matches first, then partial matches)
      const queryLower = query.toLowerCase();
      finalResults.sort((a, b) => {
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        const aArtist = a.artist.toLowerCase();
        const bArtist = b.artist.toLowerCase();
        
        // Exact title matches first
        if (aTitle === queryLower && bTitle !== queryLower) return -1;
        if (bTitle === queryLower && aTitle !== queryLower) return 1;
        
        // Exact artist matches second
        if (aArtist === queryLower && bArtist !== queryLower) return -1;
        if (bArtist === queryLower && aArtist !== queryLower) return 1;
        
        // Title starts with query
        if (aTitle.startsWith(queryLower) && !bTitle.startsWith(queryLower)) return -1;
        if (bTitle.startsWith(queryLower) && !aTitle.startsWith(queryLower)) return 1;
        
        // Artist starts with query
        if (aArtist.startsWith(queryLower) && !bArtist.startsWith(queryLower)) return -1;
        if (bArtist.startsWith(queryLower) && !aArtist.startsWith(queryLower)) return 1;
        
        // Alphabetical by title as fallback
        return aTitle.localeCompare(bTitle);
      });

      return finalResults.slice(0, limit);
    } catch (error) {
      console.error("Jellyfin search error:", error);
      throw error;
    }
  }

  /**
   * Search for audio items by title only
   */
  async searchByTitle(query: string, limit: number = 50): Promise<MediaItem[]> {
    if (!this.userId) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error("Failed to authenticate with Jellyfin");
      }
    }

    try {
      const result = await this.performSearch(query, limit, "Name");
      console.log(`Title search for "${query}" returned ${result.length} results`);
      return result;
    } catch (error) {
      console.error("Jellyfin title search error:", error);
      throw error;
    }
  }

  /**
   * Search for artists by name
   */
  async searchArtists(query: string, limit: number = 50, startIndex: number = 0): Promise<Artist[]> {
    if (!this.userId) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error("Failed to authenticate with Jellyfin");
      }
    }

    try {
      console.log(`Searching for artists: "${query}" (limit: ${limit}, startIndex: ${startIndex})`);
      
      const searchParams = new URLSearchParams({
        searchTerm: query,
        includeItemTypes: "MusicArtist",
        recursive: "true",
        limit: limit.toString(),
        startIndex: startIndex.toString(),
        userId: this.userId!,
        fields: "Overview,ImageTags",
        sortBy: "SortName",
        sortOrder: "Ascending",
      });

      console.log(`Artist search URL: ${this.baseUrl}/Items?${searchParams.toString()}`);

      const response = await fetch(
        `${this.baseUrl}/Items?${searchParams.toString()}`,
        {
          headers: {
            "X-Emby-Token": this.apiKey,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Artist search failed: ${response.status}`);
      }

      const data: JellyfinArtistSearchResponse = await response.json();
      console.log(`Jellyfin returned ${data.Items?.length || 0} artists`);
      
      const artists = this.transformArtists(data.Items || []);
      console.log(`Transformed ${artists.length} artists`);
      
      return artists;
    } catch (error) {
      console.error("Jellyfin artist search error:", error);
      throw error;
    }
  }

  /**
   * Get all songs by a specific artist ID
   */
  async getSongsByArtistId(artistId: string, limit: number = 50, startIndex: number = 0): Promise<MediaItem[]> {
    if (!this.userId) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error("Failed to authenticate with Jellyfin");
      }
    }

    try {
      console.log(`Getting songs for artist ID: ${artistId} (limit: ${limit}, startIndex: ${startIndex})`);
      
      const searchParams = new URLSearchParams({
        includeItemTypes: "Audio",
        recursive: "true",
        artistIds: artistId,
        limit: limit.toString(),
        startIndex: startIndex.toString(),
        userId: this.userId!,
        fields: "Artists,Album,RunTimeTicks",
        sortBy: "Album,SortName",
        sortOrder: "Ascending",
      });

      console.log(`Songs by artist URL: ${this.baseUrl}/Items?${searchParams.toString()}`);

      const response = await fetch(
        `${this.baseUrl}/Items?${searchParams.toString()}`,
        {
          headers: {
            "X-Emby-Token": this.apiKey,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Get songs by artist failed: ${response.status}`);
      }

      const data: JellyfinSearchResponse = await response.json();
      console.log(`Jellyfin returned ${data.Items?.length || 0} songs for artist ${artistId}`);
      
      const songs = this.transformMediaItems(data.Items || []);
      console.log(`Transformed ${songs.length} songs`);
      
      return songs;
    } catch (error) {
      console.error("Jellyfin get songs by artist error:", error);
      throw error;
    }
  }
  async searchByArtist(query: string, limit: number = 50, startIndex: number = 0): Promise<MediaItem[]> {
    if (!this.userId) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error("Failed to authenticate with Jellyfin");
      }
    }

    try {
      console.log(`Searching for artist: "${query}" (limit: ${limit}, startIndex: ${startIndex})`);
      
      // Due to Jellyfin API limitations with artist search, we need to:
      // 1. Fetch ALL audio items (or a very large batch)
      // 2. Filter by artist client-side
      // 3. Apply pagination to the filtered results
      
      // For better performance, we'll cache results per query
      const cacheKey = `artist_search_${query.toLowerCase()}`;
      
      // Check if we have cached results for this query
      if (!this.artistSearchCache) {
        this.artistSearchCache = new Map();
      }
      
      let allMatchingItems: MediaItem[] = [];
      
      if (this.artistSearchCache.has(cacheKey)) {
        console.log(`Using cached results for artist "${query}"`);
        allMatchingItems = this.artistSearchCache.get(cacheKey) || [];
      } else {
        console.log(`Fetching all songs for artist "${query}" - this may take a moment...`);
        
        // Fetch all audio items in batches to avoid memory issues
        const batchSize = 1000;
        let currentStartIndex = 0;
        let hasMoreItems = true;
        const allItems: MediaItem[] = [];
        
        while (hasMoreItems) {
          console.log(`Fetching batch ${Math.floor(currentStartIndex / batchSize) + 1} starting at index ${currentStartIndex}`);
          
          const searchParams = new URLSearchParams({
            includeItemTypes: "Audio",
            recursive: "true",
            limit: batchSize.toString(),
            startIndex: currentStartIndex.toString(),
            userId: this.userId!,
            fields: "Artists,Album,RunTimeTicks",
            sortBy: "SortName",
            sortOrder: "Ascending",
          });

          const response = await fetch(
            `${this.baseUrl}/Items?${searchParams.toString()}`,
            {
              headers: {
                "X-Emby-Token": this.apiKey,
                "Content-Type": "application/json",
              },
            },
          );

          if (!response.ok) {
            throw new Error(`Artist search failed: ${response.status}`);
          }

          const data: JellyfinSearchResponse = await response.json();
          const batchItems = this.transformMediaItems(data.Items || []);
          
          console.log(`Batch ${Math.floor(currentStartIndex / batchSize) + 1}: Got ${batchItems.length} items`);
          allItems.push(...batchItems);
          
          // Check if we have more items to fetch
          hasMoreItems = batchItems.length === batchSize;
          currentStartIndex += batchSize;
          
          // Safety check to prevent infinite loops
          if (currentStartIndex > 50000) {
            console.warn("Reached maximum fetch limit of 50,000 items");
            break;
          }
        }
        
        console.log(`Fetched ${allItems.length} total audio items`);
        
        // Filter by artist name
        const queryLower = query.toLowerCase();
        allMatchingItems = allItems.filter(item => {
          return item.artist.toLowerCase().includes(queryLower);
        });

        console.log(`Found ${allMatchingItems.length} songs by artists matching "${query}"`);
        
        // Sort by relevance (exact matches first, then partial matches)
        allMatchingItems.sort((a, b) => {
          const aArtist = a.artist.toLowerCase();
          const bArtist = b.artist.toLowerCase();
          
          // Exact artist matches first
          if (aArtist === queryLower && bArtist !== queryLower) return -1;
          if (bArtist === queryLower && aArtist !== queryLower) return 1;
          
          // Artist starts with query
          if (aArtist.startsWith(queryLower) && !bArtist.startsWith(queryLower)) return -1;
          if (bArtist.startsWith(queryLower) && !aArtist.startsWith(queryLower)) return 1;
          
          // Alphabetical by artist, then by title
          const artistCompare = aArtist.localeCompare(bArtist);
          if (artistCompare !== 0) return artistCompare;
          
          return a.title.localeCompare(b.title);
        });
        
        // Cache the results for this query (cache for 5 minutes)
        this.artistSearchCache.set(cacheKey, allMatchingItems);
        setTimeout(() => {
          this.artistSearchCache?.delete(cacheKey);
          console.log(`Cleared cache for artist search "${query}"`);
        }, 5 * 60 * 1000); // 5 minutes
      }

      // Apply pagination to the filtered and sorted results
      const paginatedResults = allMatchingItems.slice(startIndex, startIndex + limit);
      
      console.log(`Returning ${paginatedResults.length} results for page (startIndex: ${startIndex}, limit: ${limit})`);
      console.log(`Total matching songs for "${query}": ${allMatchingItems.length}`);
      
      return paginatedResults;
    } catch (error) {
      console.error("Jellyfin artist search error:", error);
      throw error;
    }
  }
  private async performSearch(
    query: string, 
    limit: number, 
    searchField: "Name" | "Artists"
  ): Promise<MediaItem[]> {
    try {
      const searchParams = new URLSearchParams({
        searchTerm: query,
        includeItemTypes: "Audio",
        recursive: "true",
        limit: (limit * 2).toString(), // Get more results to account for deduplication
        userId: this.userId!,
        fields: "Artists,Album,RunTimeTicks",
      });

      console.log(`Performing ${searchField} search for: "${query}"`);
      console.log(`Search URL: ${this.baseUrl}/Items?${searchParams.toString()}`);

      const response = await fetch(
        `${this.baseUrl}/Items?${searchParams.toString()}`,
        {
          headers: {
            "X-Emby-Token": this.apiKey,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data: JellyfinSearchResponse = await response.json();
      console.log(`Jellyfin returned ${data.Items?.length || 0} items for ${searchField} search`);
      
      const items = this.transformMediaItems(data.Items || []);
      console.log(`Transformed ${items.length} items`);
      
      // Filter results based on the search field for better relevance
      const queryLower = query.toLowerCase();
      const filtered = items.filter(item => {
        if (searchField === "Name") {
          const matches = item.title.toLowerCase().includes(queryLower);
          if (matches) {
            console.log(`Title match: "${item.title}" contains "${query}"`);
          }
          return matches;
        } else if (searchField === "Artists") {
          const matches = item.artist.toLowerCase().includes(queryLower);
          if (matches) {
            console.log(`Artist match: "${item.artist}" contains "${query}"`);
          }
          return matches;
        }
        return true;
      });

      console.log(`After filtering: ${filtered.length} items for ${searchField} search`);
      return filtered;
    } catch (error) {
      console.error(`Jellyfin ${searchField} search error:`, error);
      // Return empty array on error to not break the combined search
      return [];
    }
  }

  /**
   * Get all audio items from Jellyfin library (for browsing)
   */
  async getAllAudioItems(
    startIndex: number = 0,
    limit: number = 100,
  ): Promise<MediaItem[]> {
    if (!this.userId) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error("Failed to authenticate with Jellyfin");
      }
    }

    try {
      const searchParams = new URLSearchParams({
        includeItemTypes: "Audio",
        recursive: "true",
        startIndex: startIndex.toString(),
        limit: limit.toString(),
        userId: this.userId!,
        fields: "Artists,Album,RunTimeTicks",
        sortBy: "SortName",
        sortOrder: "Ascending",
      });

      const url = `${this.baseUrl}/Items?${searchParams.toString()}`;
      console.log("Jellyfin API URL:", url);

      const response = await fetch(url, {
        headers: {
          "X-Emby-Token": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(
          "Jellyfin API response not OK:",
          response.status,
          response.statusText,
        );
        throw new Error(`Failed to fetch audio items: ${response.status}`);
      }

      const data: JellyfinSearchResponse = await response.json();
      console.log("Jellyfin raw response:", {
        totalRecordCount: data.TotalRecordCount,
        itemsLength: data.Items?.length,
        firstItem: data.Items?.[0],
      });

      const transformedItems = this.transformMediaItems(data.Items);
      console.log("Transformed items count:", transformedItems.length);

      return transformedItems;
    } catch (error) {
      console.error("Jellyfin get audio items error:", error);
      throw error;
    }
  }

  /**
   * Get stream URL for a media item
   */
  getStreamUrl(itemId: string): string {
    // Use our proxy endpoint instead of direct Jellyfin URL to handle auth properly
    return `/api/stream/${itemId}`;
  }

  /**
   * Get direct Jellyfin stream URL (for internal use by proxy)
   */
  async getDirectStreamUrl(itemId: string): Promise<string> {
    if (!this.userId) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error("User ID not available - authentication required");
      }
    }
    // Use the proper streaming endpoint with required parameters
    // This endpoint should handle transcoding and streaming properly
    return `${this.baseUrl}/Audio/${itemId}/universal?userId=${this.userId}&deviceId=karaoke-app&api_key=${this.apiKey}&container=mp3,aac,m4a,flac,webma,webm,wav,ogg`;
  }

  /**
   * Get detailed metadata for a specific item
   */
  async getMediaMetadata(itemId: string): Promise<MediaItem | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/Items/${itemId}?userId=${this.userId}&fields=Artists,Album,RunTimeTicks`,
        {
          headers: {
            "X-Emby-Token": this.apiKey,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to get metadata: ${response.status}`);
      }

      const item: JellyfinMediaItem = await response.json();
      return this.transformMediaItem(item);
    } catch (error) {
      console.error("Jellyfin get metadata error:", error);
      return null;
    }
  }

  /**
   * Check if Jellyfin server is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/System/Info`, {
        headers: {
          "X-Emby-Token": this.apiKey,
        },
      });
      return response.ok;
    } catch (error) {
      console.error("Jellyfin health check failed:", error);
      return false;
    }
  }

  /**
   * Get lyrics for a media item from Jellyfin
   */
  async getLyrics(itemId: string): Promise<string | any[] | null> {
    if (!this.userId) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error("Failed to authenticate with Jellyfin");
      }
    }

    try {
      console.log(`Attempting to get lyrics for item: ${itemId}`);
      console.log(`Using Jellyfin base URL: ${this.baseUrl}`);

      // Try to get lyrics from Jellyfin's lyrics endpoint
      const lyricsUrl = `${this.baseUrl}/Audio/${itemId}/Lyrics`;
      console.log(`Trying lyrics URL: ${lyricsUrl}`);

      const response = await fetch(lyricsUrl, {
        headers: {
          "X-Emby-Token": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      console.log(`Lyrics API response status: ${response.status}`);
      console.log(
        `Lyrics API response headers:`,
        Object.fromEntries(response.headers.entries()),
      );

      if (response.ok) {
        const lyricsData = await response.json();
        console.log("Lyrics data received:", lyricsData);

        // Jellyfin lyrics API returns the lyrics directly as an array
        if (Array.isArray(lyricsData)) {
          console.log(
            "Received lyrics array with",
            lyricsData.length,
            "entries",
          );
          return lyricsData;
        } else if (lyricsData.Lyrics) {
          return lyricsData.Lyrics;
        } else if (typeof lyricsData === "string") {
          return lyricsData;
        } else if (lyricsData.lyrics) {
          return lyricsData.lyrics;
        } else {
          console.log("Lyrics data structure:", Object.keys(lyricsData));
          return null;
        }
      } else {
        const errorText = await response.text();
        console.log(`Lyrics API error response: ${errorText}`);
      }

      // If the direct lyrics endpoint doesn't work, try alternative approaches
      console.log(
        "Direct lyrics endpoint failed, trying alternative methods...",
      );

      // Try getting item details to see if lyrics are embedded
      const itemResponse = await fetch(
        `${this.baseUrl}/Items/${itemId}?userId=${this.userId}&fields=MediaStreams,MediaSources`,
        {
          headers: {
            "X-Emby-Token": this.apiKey,
            "Content-Type": "application/json",
          },
        },
      );

      if (itemResponse.ok) {
        const itemData = await itemResponse.json();
        console.log("Item data received, checking for lyrics streams...");

        const mediaStreams = itemData.MediaSources?.[0]?.MediaStreams || [];
        console.log(`Found ${mediaStreams.length} media streams`);

        // Look for subtitle streams that might contain lyrics
        const lyricsStreams = mediaStreams.filter(
          (stream: any) =>
            stream.Type === "Subtitle" &&
            (stream.Codec === "lrc" ||
              stream.DisplayTitle?.toLowerCase().includes("lyrics") ||
              stream.Language?.toLowerCase().includes("lrc")),
        );

        console.log(
          `Found ${lyricsStreams.length} potential lyrics streams:`,
          lyricsStreams,
        );

        if (lyricsStreams.length > 0) {
          const lyricsStream = lyricsStreams[0];
          console.log("Trying to get lyrics from stream:", lyricsStream);

          // Try to get the subtitle/lyrics content
          const subtitleUrl = `${this.baseUrl}/Videos/${itemId}/${lyricsStream.Index}/Subtitles/0/Stream.lrc?api_key=${this.apiKey}`;
          console.log("Trying subtitle URL:", subtitleUrl);

          const subtitleResponse = await fetch(subtitleUrl, {
            headers: {
              "X-Emby-Token": this.apiKey,
            },
          });

          if (subtitleResponse.ok) {
            const lyricsContent = await subtitleResponse.text();
            console.log(
              "Got lyrics from subtitle stream, length:",
              lyricsContent.length,
            );
            return lyricsContent;
          } else {
            console.log(
              "Subtitle stream request failed:",
              subtitleResponse.status,
            );
          }
        }
      }

      return null;
    } catch (error) {
      console.error("Failed to get lyrics from Jellyfin:", error);
      return null;
    }
  }

  /**
   * Check if an item has lyrics available
   */
  async hasLyrics(itemId: string): Promise<boolean> {
    const lyrics = await this.getLyrics(itemId);
    if (Array.isArray(lyrics)) {
      return (
        lyrics.length > 0 &&
        lyrics.some((item) => item.Text && item.Text.trim())
      );
    }
    return (
      lyrics !== null && typeof lyrics === "string" && lyrics.trim().length > 0
    );
  }
  async getLibraries(): Promise<unknown[]> {
    if (!this.userId) {
      await this.authenticate();
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/Users/${this.userId}/Views`,
        {
          headers: {
            "X-Emby-Token": this.apiKey,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to get libraries: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        "Available libraries:",
        data.Items?.map((lib: any) => ({
          name: lib.Name,
          id: lib.Id,
          type: lib.CollectionType,
        })),
      );

      return data.Items || [];
    } catch (error) {
      console.error("Failed to get libraries:", error);
      return [];
    }
  }

  /**
   * Transform Jellyfin artists to our Artist format
   */
  private transformArtists(items: JellyfinArtist[]): Artist[] {
    return items
      .filter(item => item.Type === "MusicArtist")
      .map((item) => this.transformArtist(item))
      .filter(Boolean) as Artist[];
  }

  /**
   * Transform a single Jellyfin artist to our Artist format
   */
  private transformArtist(item: JellyfinArtist): Artist | null {
    if (item.Type !== "MusicArtist") {
      return null;
    }

    return {
      id: `jellyfin_artist_${item.Id}`,
      name: item.Name || "Unknown Artist",
      jellyfinId: item.Id,
      imageUrl: item.ImageTags?.Primary 
        ? `${this.baseUrl}/Items/${item.Id}/Images/Primary?maxHeight=300&maxWidth=300&quality=90`
        : undefined,
    };
  }
  private transformMediaItems(items: JellyfinMediaItem[]): MediaItem[] {
    return items
      .map((item) => this.transformMediaItem(item))
      .filter(Boolean) as MediaItem[];
  }

  /**
   * Transform a single Jellyfin media item to our MediaItem format
   */
  private transformMediaItem(item: JellyfinMediaItem): MediaItem | null {
    if (item.Type !== "Audio") {
      return null;
    }

    // Convert RunTimeTicks to seconds (Jellyfin uses 10,000,000 ticks per second)
    const duration = item.RunTimeTicks
      ? Math.round(item.RunTimeTicks / 10000000)
      : 0;

    return {
      id: `jellyfin_${item.Id}`,
      title: item.Name || "Unknown Title",
      artist: item.Artists?.join(", ") || "Unknown Artist",
      album: item.Album,
      duration,
      jellyfinId: item.Id,
      streamUrl: this.getStreamUrl(item.Id),
      lyricsPath: this.detectLyricsPath(item),
    };
  }

  /**
   * Detect potential lyrics file path for a media item
   */
  private detectLyricsPath(item: JellyfinMediaItem): string | undefined {
    // For now, we'll use the Jellyfin ID as the lyrics identifier
    // The lyrics service will search for files with this ID in configured paths
    return `jellyfin_${item.Id}`;
  }
}

// Singleton instance
let jellyfinService: JellyfinService | null = null;

export function getJellyfinService(): JellyfinService {
  if (!jellyfinService) {
    jellyfinService = new JellyfinService();
  }
  return jellyfinService;
}
