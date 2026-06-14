"use client";

import { useState, useEffect } from "react";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import {
  CheckCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { UpdateBanner, UpdateBadge } from "./cache-status/UpdateBanner";
import { CacheActions } from "./cache-status/CacheActions";

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

  const loadCacheInfo = async () => {
    try {
      const info = await getCacheInfo();
      setCacheInfo(info);
    } catch (error) {
      console.error("Failed to load cache info:", error);
    }
  };

  useEffect(() => {
    if (isSupported) {
      loadCacheInfo();
    }
  }, [isSupported]);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      const success = await clearCache();
      if (success) {
        setLastCleared(new Date());
        setCacheInfo({});
        setTimeout(loadCacheInfo, 1000);
      }
    } catch (error) {
      console.error("Failed to clear cache:", error);
    } finally {
      setIsClearing(false);
    }
  };

  const totalCachedItems = Object.values(cacheInfo).reduce(
    (sum, count) => sum + count,
    0
  );

  if (!isSupported) {
    return null;
  }

  return (
    <div
      data-testid="cache-status"
      className={`bg-white rounded-lg border ${className}`}
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <InformationCircleIcon className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-medium text-gray-900">Cache Status</h3>
          </div>
          {isUpdateAvailable && <UpdateBadge />}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {isUpdateAvailable && (
          <UpdateBanner
            isUpdating={isUpdating}
            onUpdate={() => updateServiceWorker()}
          />
        )}

        <div data-testid="cache-stats" className="space-y-2">
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
            <div
              data-testid="cache-cleared"
              className="flex items-center text-xs text-green-600"
            >
              <CheckCircleIcon className="w-3 h-3 mr-1" />
              <span>Cleared {lastCleared.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        <CacheActions isClearing={isClearing} onClear={handleClearCache} />

        <p className="text-xs text-gray-500">
          Clear cache if the app isn&apos;t showing updates or behaving
          unexpectedly.
        </p>
      </div>
    </div>
  );
}
