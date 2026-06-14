import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface UpdateBannerProps {
  isUpdating: boolean;
  onUpdate: () => void;
}

export function UpdateBanner({ isUpdating, onUpdate }: UpdateBannerProps) {
  return (
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
          onClick={onUpdate}
          disabled={isUpdating}
          className="px-3 py-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white text-xs font-medium rounded transition-colors"
        >
          {isUpdating ? "Updating..." : "Update"}
        </button>
      </div>
    </div>
  );
}

export function UpdateBadge() {
  return (
    <div className="flex items-center text-orange-600">
      <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
      <span className="text-xs font-medium">Update Available</span>
    </div>
  );
}
