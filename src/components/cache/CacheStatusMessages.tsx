import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface CacheStatusMessagesProps {
  isCleared: boolean;
  error: string | null;
}

export function CacheStatusMessages({
  isCleared,
  error,
}: CacheStatusMessagesProps) {
  return (
    <>
      {isCleared && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <h3 className="font-medium text-green-800">
                Cache cleared successfully!
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Redirecting to home page in a moment...
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-800">Error clearing cache</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
