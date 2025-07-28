"use client";

import { useState, useEffect } from "react";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import {
  TrashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

interface CacheStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function CacheStatus({
  className = "",
  showDetails = false,
}: CacheStatusProps) {
  const {
    isSupported,
    isUpdateAvailable,
    isUpdating,
    updateServiceWorker,
    clearCache,
    getCacheInfo,
  } = useServiceWorker();

  const [cacheInfo, setCacheInfo] = useState<Record<string, number>>({});
  const [isClearing, setIsClearing] = useState(false);
  const [lastCleared, setLastCleared] = useState<Date | null>(null);

  useEffect(() => {
    if (isSupported) {
      loadCacheInfo();
    }
  }, [isSupported]);

  const loadCacheInfo = async () => {
    try {
      const info = await getCacheInfo();
      setCacheInfo(info);
    } catch (error) {
      console.error("Failed to load cache info:", error);
    }
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      const success = await clearCache();
      if (success) {
        setLastCleared(new Date());
        setCacheInfo({});
        // Reload cache info after a short delay
        setTimeout(loadCacheInfo, 1000);
      }
    } catch (error) {
      console.error("Failed to clear cache:", error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleUpdate = () => {
    updateServiceWorker();
  };

  const goToClearCachePage = () => {
    window.open("/clear-cache", "_blank");
  };

  const totalCachedItems = Object.values(cacheInfo).reduce(
    (sum, count) => sum + count,
    0
  );

  if (!isSupported) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <InformationCircleIcon className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-medium text-gray-900">Cache Status</h3>
          </div>
          {isUpdateAvailable && (
            <div className="flex items-center text-orange-600">
              <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
              <span className="text-xs font-medium">Update Available</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Update Available */}
        {isUpdateAvailable && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">
                  App update available
                </p>
                <p className="text-xs text-orange-600">
                  Restart to get the latest version
                </p>
              </div>
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="px-3 py-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white text-xs font-medium rounded transition-colors"
              >
                {isUpdating ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        )}

        {/* Cache Info */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Cached items:</span>
            <span className="font-medium text-gray-900">
              {totalCachedItems}
            </span>
          </div>

          {showDetails && Object.keys(cacheInfo).length > 0 && (
            <div className="space-y-1">
              {Object.entries(cacheInfo).map(([cacheName, count]) => (
                <div
                  key={cacheName}
                  className="flex justify-between items-center text-xs"
                >
                  <span className="text-gray-500 truncate">{cacheName}</span>
                  <span className="text-gray-400">{count}</span>
                </div>
              ))}
            </div>
          )}

          {lastCleared && (
            <div className="flex items-center text-xs text-green-600">
              <CheckCircleIcon className="w-3 h-3 mr-1" />
              <span>Cleared {lastCleared.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={handleClearCache}
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
            onClick={goToClearCachePage}
            className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded transition-colors"
          >
            Full Clear
          </button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-500">
          Clear cache if the app isn&apos;t showing updates or behaving
          unexpectedly.
        </p>
      </div>
    </div>
  );
}
