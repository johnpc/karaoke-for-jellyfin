// API response factory utilities
import { ApiResponse, PaginatedResponse } from "@/types";

export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date(),
  };
}

export function createErrorResponse(
  code: string,
  message: string,
  details?: string | Record<string, unknown>
): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date(),
    },
    timestamp: new Date(),
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
    timestamp: new Date(),
  };
}
