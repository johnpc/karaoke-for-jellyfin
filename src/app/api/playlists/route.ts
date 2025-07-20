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
      0,
    );

    const jellyfinService = getJellyfinSDKService();

    // Health check first
    const isHealthy = await jellyfinService.healthCheck();
    if (!isHealthy) {
      return NextResponse.json(
        createErrorResponse(
          "JELLYFIN_UNAVAILABLE",
          "Jellyfin server is not accessible",
        ),
        { status: 503 },
      );
    }

    // Get playlists using the SDK
    const playlists = await jellyfinService.getPlaylists(limit, startIndex);

    return NextResponse.json(
      createPaginatedResponse(
        playlists,
        Math.floor(startIndex / limit) + 1,
        limit,
        playlists.length,
      ),
    );
  } catch (error) {
    console.error("Get playlists API error:", error);
    return NextResponse.json(
      createErrorResponse(
        "PLAYLIST_FETCH_FAILED",
        "Failed to fetch playlists",
      ),
      { status: 500 },
    );
  }
}
