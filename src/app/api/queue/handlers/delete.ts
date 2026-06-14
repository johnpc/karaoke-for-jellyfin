import { NextRequest, NextResponse } from "next/server";
import { getSessionManager } from "@/services/session";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";

export async function handleDelete(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const queueItemId = searchParams.get("itemId");
    const userId = searchParams.get("userId");

    if (!queueItemId || !userId) {
      return NextResponse.json(
        createErrorResponse(
          "INVALID_REQUEST",
          "itemId and userId are required"
        ),
        { status: 400 }
      );
    }

    const sessionManager = getSessionManager();
    const result = sessionManager.removeSongFromQueue(queueItemId, userId);

    if (!result.success) {
      return NextResponse.json(
        createErrorResponse("REMOVE_SONG_FAILED", result.message),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createSuccessResponse({
        queue: result.newQueue,
        message: result.message,
      })
    );
  } catch (error) {
    console.error("Queue DELETE error:", error);
    return NextResponse.json(
      createErrorResponse(
        "QUEUE_DELETE_FAILED",
        "Failed to remove song from queue"
      ),
      { status: 500 }
    );
  }
}
