import {
  ArrowPathIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { CacheInfo } from "@/hooks/useCacheManager";

interface CacheInfoDisplayProps {
  isLoadingInfo: boolean;
  cacheInfo: CacheInfo;
  totalCachedItems: number;
}

export function CacheInfoDisplay({
  isLoadingInfo,
  cacheInfo,
  totalCachedItems,
}: CacheInfoDisplayProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <InformationCircleIcon className="w-5 h-5 mr-2 text-blue-600" />
        Cache Information
      </h2>

      {isLoadingInfo ? (
        <div className="flex items-center text-gray-500">
          <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
          Loading cache information...
        </div>
      ) : (
        <div className="space-y-3">
          {Object.keys(cacheInfo).length === 0 ? (
            <p className="text-gray-500">No cached data found</p>
          ) : (
            <>
              {Object.entries(cacheInfo).map(([cacheName, count]) => (
                <div
                  key={cacheName}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                >
                  <span className="font-medium text-gray-700">{cacheName}</span>
                  <span className="text-sm text-gray-500">{count} items</span>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-gray-900">Total cached items:</span>
                  <span className="text-gray-900">{totalCachedItems}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
