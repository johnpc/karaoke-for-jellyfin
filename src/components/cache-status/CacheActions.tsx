import { TrashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

interface CacheActionsProps {
  isClearing: boolean;
  onClear: () => void;
}

export function CacheActions({ isClearing, onClear }: CacheActionsProps) {
  return (
    <div className="flex space-x-2">
      <button
        data-testid="clear-cache-button"
        onClick={onClear}
        disabled={isClearing}
        className="flex-1 flex items-center justify-center px-3 py-2 bg-red-50 hover:bg-red-100 disabled:bg-gray-50 text-red-700 disabled:text-gray-400 text-xs font-medium rounded transition-colors"
      >
        {isClearing ? (
          <>
            <ArrowPathIcon className="w-3 h-3 mr-1 animate-spin" />
            Clearing...
          </>
        ) : (
          <>
            <TrashIcon className="w-3 h-3 mr-1" />
            Quick Clear
          </>
        )}
      </button>
      <button
        onClick={() => window.open("/clear-cache", "_blank")}
        className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded transition-colors"
      >
        Full Clear
      </button>
    </div>
  );
}
