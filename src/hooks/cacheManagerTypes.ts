export interface CacheInfo {
  [cacheName: string]: number;
}

export interface CacheManagerState {
  isClearing: boolean;
  isCleared: boolean;
  error: string | null;
  cacheInfo: CacheInfo;
  isLoadingInfo: boolean;
  totalCachedItems: number;
}

export interface CacheManagerActions {
  clearAllData: () => Promise<void>;
  refreshPage: () => void;
  goHome: () => void;
}
