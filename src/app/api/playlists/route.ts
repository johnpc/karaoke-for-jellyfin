// API route for playlist listing using Jellyfin SDK
import { NextRequest, NextResponse } from "next/server";
import { getJellyfinSDKService } from "@/services/jellyfin-sdk";
import {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
} from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 1000);
    const startIndex = Math.max(
      parseInt(searchParams.get("startIndex") || "0"),
      0
    );

    const jellyfinService = getJellyfinSDKService();

    // Health check first
    const isHealthy = await jellyfinService.healthCheck();
    if (!isHealthy) {
      return NextResponse.json(
        createErrorResponse(
          "JELLYFIN_UNAVAILABLE",
          "Jellyfin server is not accessible"
        ),
        { status: 503 }
      );
    }

    // Get playlists using the SDK
    let playlists = await jellyfinService.getPlaylists(limit, startIndex);

    // Apply playlist name filtering if PLAYLIST_FILTER_REGEX is set
    const playlistFilterRegex = process.env.PLAYLIST_FILTER_REGEX;
    if (playlistFilterRegex) {
      try {
        const regex = new RegExp(playlistFilterRegex, "i"); // Case-insensitive by default
        playlists = playlists.filter(playlist => regex.test(playlist.name));
        console.log(
          `Applied playlist filter "${playlistFilterRegex}": ${playlists.length} playlists match`
        );
      } catch (error) {
        console.warn(
          "Invalid PLAYLIST_FILTER_REGEX:",
          playlistFilterRegex,
          error
        );
        // Continue without filtering if regex is invalid
      }
    }

    // Debug: Log all playlist names before deduplication
    console.log("Playlists before deduplication:");
    playlists.forEach((playlist, index) => {
      console.log(
        `  ${index}: "${playlist.name}" (length: ${playlist.name.length}, id: ${playlist.id})`
      );
    });

    // Remove duplicates by name (keep the first occurrence)
    // Normalize names for comparison to handle whitespace, case, and encoding differences
    const normalizedNames = new Set<string>();
    const uniquePlaylists = playlists.filter(playlist => {
      // Normalize the name:
      // 1. Trim whitespace
      // 2. Convert to lowercase
      // 3. Normalize unicode (NFD)
      // 4. Replace all whitespace (including non-breaking spaces) with single regular spaces
      // 5. Remove any remaining extra spaces
      const normalizedName = playlist.name
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/\s+/g, " ") // Replace multiple whitespace chars with single space
        .replace(/[\u00A0\u2000-\u200B\u2028\u2029]/g, " "); // Replace various unicode spaces with regular space

      if (normalizedNames.has(normalizedName)) {
        console.log(
          `Duplicate playlist found: "${playlist.name}" (normalized: "${normalizedName}")`
        );
        return false; // Skip this duplicate
      }

      normalizedNames.add(normalizedName);
      return true; // Keep this playlist
    });

    console.log(
      `After deduplication: ${uniquePlaylists.length} unique playlists (removed ${playlists.length - uniquePlaylists.length} duplicates)`
    );

    return NextResponse.json(
      createPaginatedResponse(
        uniquePlaylists,
        Math.floor(startIndex / limit) + 1,
        limit,
        uniquePlaylists.length
      )
    );
  } catch (error) {
    console.error("Get playlists API error:", error);
    return NextResponse.json(
      createErrorResponse("PLAYLIST_FETCH_FAILED", "Failed to fetch playlists"),
      { status: 500 }
    );
  }
}
