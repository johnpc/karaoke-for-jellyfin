"use client";

interface LoadingSpinnerProps {
  message: string;
}

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <div
      data-testid="search-loading"
      className="flex items-center justify-center py-12"
    >
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      <span className="ml-3 text-gray-600">{message}</span>
    </div>
  );
}
