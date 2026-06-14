// Validation primitives: error class, error messages, and basic type guards
import { TypeGuard, ErrorCode, ErrorMessage } from "@/types";

export class ValidationError extends Error {
  constructor(
    message: string,
    public code: ErrorCode = "INVALID_REQUEST",
    public field?: string
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export function createErrorMessage(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): ErrorMessage {
  return {
    code,
    message,
    details,
    timestamp: new Date(),
  };
}

export const isString: TypeGuard<string> = (value): value is string => {
  return typeof value === "string";
};

export const isNumber: TypeGuard<number> = (value): value is number => {
  return typeof value === "number" && !isNaN(value);
};

export const isPositiveNumber: TypeGuard<number> = (value): value is number => {
  return isNumber(value) && value > 0;
};

export const isNonNegativeNumber: TypeGuard<number> = (
  value
): value is number => {
  return isNumber(value) && value >= 0;
};

export const isValidDate: TypeGuard<Date> = (value): value is Date => {
  return value instanceof Date && !isNaN(value.getTime());
};

export const isValidUrl: TypeGuard<string> = (value): value is string => {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};
