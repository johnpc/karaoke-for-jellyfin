import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";

export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: string
) {
  return NextResponse.json<ApiResponse>(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
        timestamp: new Date(),
      },
      timestamp: new Date(),
    },
    { status }
  );
}

export function successResponse<T>(data: T) {
  return NextResponse.json<ApiResponse<T>>({
    success: true,
    data,
    timestamp: new Date(),
  });
}
