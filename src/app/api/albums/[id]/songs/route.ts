import { NextRequest, NextResponse } from "next/server";
import { getJellyfinService } from "@/services/jellyfin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const startIndex = parseInt(searchParams.get("startIndex") || "0");

    const resolvedParams = await params;
    const albumId = resolvedParams.id;

    // Extract the Jellyfin ID from our prefixed ID
    const jellyfinId = albumId.startsWith("jellyfin_album_")
      ? albumId.replace("jellyfin_album_", "")
      : albumId;

    console.log(
      `Album songs API: albumId="${albumId}", jellyfinId="${jellyfinId}", limit=${limit}, startIndex=${startIndex}`
    );

    const jellyfinService = getJellyfinService();
    const songs = await jellyfinService.getSongsByAlbumId(
      jellyfinId,
      limit,
      startIndex
    );

    console.log(
      `Album songs API: returning ${songs.length} songs for album ${albumId}`
    );

    return NextResponse.json({
      success: true,
      data: songs,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Album songs API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ALBUM_SONGS_FETCH_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Failed to get songs by album",
        },
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
