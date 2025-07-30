import { NextRequest, NextResponse } from "next/server";
import { getJellyfinService } from "@/services/jellyfin";
import { Album } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "50");
    const startIndex = parseInt(searchParams.get("startIndex") || "0");

    console.log(
      `Albums API: query="${query}", limit=${limit}, startIndex=${startIndex}`
    );

    const jellyfinService = getJellyfinService();

    let albums: Album[];
    if (query.trim()) {
      // Search for albums by name
      albums = await jellyfinService.searchAlbums(query, limit, startIndex);
    } else {
      // For now, return empty array when no query is provided
      // In the future, we could implement browsing all albums
      albums = [];
    }

    console.log(`Albums API: returning ${albums.length} albums`);

    return NextResponse.json({
      success: true,
      data: albums,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Albums API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ALBUMS_SEARCH_FAILED",
          message:
            error instanceof Error ? error.message : "Failed to search albums",
        },
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
