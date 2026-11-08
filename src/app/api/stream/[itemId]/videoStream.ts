// Video variant of the stream proxy: /api/stream/{id}?type=video
import type { NextRequest } from "next/server";
import { getJellyfinService } from "@/services/jellyfin";
import { buildVideoStreamUrl } from "@/lib/mediaType";

export function isVideoStreamRequest(request: NextRequest): boolean {
  return new URL(request.url).searchParams.get("type") === "video";
}

/** Direct (static, non-transcoded) Jellyfin video stream for an item */
export async function getVideoStreamUrl(itemId: string): Promise<string> {
  const ctx = await getJellyfinService().ensureAuth();
  return buildVideoStreamUrl(ctx.baseUrl, itemId);
}
