"use client";

import { VideoCameraIcon } from "@heroicons/react/24/outline";
import { MediaItem } from "@/types";
import { isVideoMediaItem } from "@/lib/mediaType";

interface MediaTypeBadgeProps {
  song: Pick<MediaItem, "mediaType">;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-base",
};

/**
 * Small "Video" badge for karaoke video entries. Renders nothing for audio,
 * so existing song rows are unchanged.
 */
export function MediaTypeBadge({
  song,
  size = "sm",
  className = "",
}: MediaTypeBadgeProps) {
  if (!isVideoMediaItem(song)) return null;

  return (
    <span
      data-testid="video-badge"
      title="Karaoke video - lyrics are part of the video"
      className={`inline-flex items-center rounded-full font-medium bg-purple-100 text-purple-800 border border-purple-200 ${SIZE_CLASSES[size]} ${className}`}
    >
      <VideoCameraIcon className="w-3 h-3 mr-1" />
      Video
    </span>
  );
}
