// Debug API route to check Jellyfin libraries and connection
import { NextResponse } from "next/server";
import { getJellyfinService } from "@/services/jellyfin";

export async function GET() {
  try {
    const jellyfinService = getJellyfinService();

    // Health check
    const isHealthy = await jellyfinService.healthCheck();
    if (!isHealthy) {
      return NextResponse.json(
        { error: "Jellyfin server is not accessible" },
        { status: 503 },
      );
    }

    // Get libraries
    const libraries = await jellyfinService.getLibraries();

    // Try to get items without the Audio filter to see what's available
    const allItemsResponse = await fetch(
      `${process.env.JELLYFIN_SERVER_URL}/Items?recursive=true&limit=10&userId=${(jellyfinService as any).userId}&fields=Type,MediaType`,
      {
        headers: {
          "X-Emby-Token": process.env.JELLYFIN_API_KEY!,
          "Content-Type": "application/json",
        },
      },
    );

    let allItems = [];
    if (allItemsResponse.ok) {
      const allItemsData = await allItemsResponse.json();
      allItems =
        allItemsData.Items?.map((item: any) => ({
          name: item.Name,
          type: item.Type,
          mediaType: item.MediaType,
        })) || [];
    }

    return NextResponse.json({
      healthy: isHealthy,
      libraries: libraries.map((lib: any) => ({
        name: lib.Name,
        id: lib.Id,
        type: lib.CollectionType,
      })),
      sampleItems: allItems,
      userId: (jellyfinService as unknown).userId,
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      {
        error: "Debug check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
