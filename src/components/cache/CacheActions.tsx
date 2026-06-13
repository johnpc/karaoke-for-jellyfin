import { TrashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

interface CacheActionsProps {
  isClearing: boolean;
  isCleared: boolean;
  onClear: () => void;
  onRefresh: () => void;
  onGoHome: () => void;
}

export function CacheActions({
  isClearing,
  isCleared,
  onClear,
  onRefresh,
  onGoHome,
}: CacheActionsProps) {
  return (
    <div className="space-y-4">
      <button
        onClick={onClear}
        disabled={isClearing || isCleared}
        className="w-full flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
      >
        {isClearing ? (
          <>
            <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
            Clearing cache...
          </>
        ) : (
          <>
            <TrashIcon className="w-5 h-5 mr-2" />
            Clear All Cache & Data
          </>
        )}
      </button>

      <div className="flex space-x-3">
        <button
          onClick={onRefresh}
          disabled={isClearing}
          className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4 mr-2" />
          Refresh Page
        </button>

        <button
          onClick={onGoHome}
          disabled={isClearing}
          className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-100 hover:bg-purple-200 disabled:bg-gray-50 text-purple-700 font-medium rounded-lg transition-colors"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}
