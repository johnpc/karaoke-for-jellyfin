import { NextRequest, NextResponse } from "next/server";
import { getSessionManager } from "@/services/session";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";

export async function handlePut(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action, queueItemId, newPosition, userId } = body;

    if (!action || !userId) {
      return NextResponse.json(
        createErrorResponse(
          "INVALID_REQUEST",
          "action and userId are required"
        ),
        { status: 400 }
      );
    }

    const sessionManager = getSessionManager();

    switch (action) {
      case "reorder": {
        if (!queueItemId || newPosition === undefined) {
          return NextResponse.json(
            createErrorResponse(
              "INVALID_REQUEST",
              "queueItemId and newPosition are required for reorder"
            ),
            { status: 400 }
          );
        }

        const result = sessionManager.reorderQueue(
          queueItemId,
          newPosition,
          userId
        );

        if (!result.success) {
          return NextResponse.json(
            createErrorResponse("REORDER_FAILED", result.message),
            { status: 400 }
          );
        }

        return NextResponse.json(
          createSuccessResponse({
            queue: result.newQueue,
            message: result.message,
          })
        );
      }

      case "skip": {
        const skipResult = sessionManager.skipCurrentSong(userId);

        if (!skipResult.success) {
          return NextResponse.json(
            createErrorResponse("SKIP_FAILED", skipResult.message),
            { status: 400 }
          );
        }

        return NextResponse.json(
          createSuccessResponse({
            message: skipResult.message,
            currentSong: sessionManager.getCurrentSong(),
            playbackState: sessionManager.getPlaybackState(),
          })
        );
      }

      default:
        return NextResponse.json(
          createErrorResponse("INVALID_ACTION", `Unknown action: ${action}`),
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Queue PUT error:", error);
    return NextResponse.json(
      createErrorResponse("QUEUE_UPDATE_FAILED", "Failed to update queue"),
      { status: 500 }
    );
  }
}
