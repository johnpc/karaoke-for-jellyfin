import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/lib/validation";
import { createErrorResponse } from "@/lib/utils";
import {
  handleCreateSession,
  handleJoinSession,
  handleAddSong,
} from "./post-actions";

export async function handlePost(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action, mediaItem, userId, userName, position } = body;

    if (!action) {
      return NextResponse.json(
        createErrorResponse("INVALID_REQUEST", "Action is required"),
        { status: 400 }
      );
    }

    switch (action) {
      case "create-session":
        if (!userName) {
          return NextResponse.json(
            createErrorResponse(
              "INVALID_REQUEST",
              "userName is required for creating session"
            ),
            { status: 400 }
          );
        }
        try {
          return handleCreateSession(userName);
        } catch (error) {
          if (error instanceof ValidationError) {
            return NextResponse.json(
              createErrorResponse("SESSION_EXISTS", error.message),
              { status: 409 }
            );
          }
          throw error;
        }

      case "join-session":
        if (!userName) {
          return NextResponse.json(
            createErrorResponse(
              "INVALID_REQUEST",
              "userName is required for joining session"
            ),
            { status: 400 }
          );
        }
        try {
          return handleJoinSession(userName);
        } catch (error) {
          if (error instanceof ValidationError) {
            return NextResponse.json(
              createErrorResponse("JOIN_FAILED", error.message),
              { status: 400 }
            );
          }
          throw error;
        }

      case "add-song":
        if (!mediaItem || !userId) {
          return NextResponse.json(
            createErrorResponse(
              "INVALID_REQUEST",
              "mediaItem and userId are required"
            ),
            { status: 400 }
          );
        }
        try {
          return handleAddSong(mediaItem, userId, position);
        } catch (error) {
          if (error instanceof ValidationError) {
            return NextResponse.json(
              createErrorResponse("VALIDATION_ERROR", error.message),
              { status: 400 }
            );
          }
          throw error;
        }

      default:
        return NextResponse.json(
          createErrorResponse("INVALID_ACTION", `Unknown action: ${action}`),
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Queue POST error:", error);
    return NextResponse.json(
      createErrorResponse(
        "QUEUE_OPERATION_FAILED",
        "Failed to perform queue operation"
      ),
      { status: 500 }
    );
  }
}
