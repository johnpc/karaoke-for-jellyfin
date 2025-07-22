"use client";

import { MediaItem } from "@/types";

interface LyricsIndicatorProps {
  song: MediaItem;
  size?: "sm" | "md" | "lg";
  variant?: "badge" | "icon" | "text";
  className?: string;
}

export function LyricsIndicator({
  song,
  size = "sm",
  variant = "badge",
  className = "",
}: LyricsIndicatorProps) {
  // Use Jellyfin's authoritative HasLyrics field, with fallback to lyricsPath check
  const hasLyrics = song.hasLyrics ?? Boolean(song.lyricsPath);

  // Size classes
  const sizeClasses = {
    sm: {
      badge: "px-2 py-0.5 text-xs",
      icon: "w-4 h-4",
      text: "text-xs",
    },
    md: {
      badge: "px-2.5 py-1 text-sm",
      icon: "w-5 h-5",
      text: "text-sm",
    },
    lg: {
      badge: "px-3 py-1.5 text-base",
      icon: "w-6 h-6",
      text: "text-base",
    },
  };

  // Determine state and styling
  let stateClasses: string;
  let content: React.ReactNode;
  let tooltip: string;

  if (hasLyrics) {
    stateClasses = "bg-green-100 text-green-800 border border-green-200";
    content =
      variant === "badge" ? (
        <>
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"
              clipRule="evenodd"
            />
          </svg>
          Karaoke
        </>
      ) : variant === "icon" ? (
        <svg
          className={sizeClasses[size].icon}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        "Karaoke"
      );
    tooltip = "Lyrics available";
  } else {
    stateClasses = "bg-gray-100 text-gray-600 border border-gray-200";
    content =
      variant === "badge" ? (
        <>
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-2.21-.896-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 12a5.983 5.983 0 01-.757 2.829 1 1 0 11-1.415-1.414A3.987 3.987 0 0013 12a3.987 3.987 0 00-.172-1.415 1 1 0 010-1.414z"
              clipRule="evenodd"
            />
            <path d="M13.293 7.293a1 1 0 011.414 0L16 8.586l1.293-1.293a1 1 0 111.414 1.414L17.414 10l1.293 1.293a1 1 0 01-1.414 1.414L16 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L14.586 10l-1.293-1.293a1 1 0 010-1.414z" />
          </svg>
          Audio Only
        </>
      ) : variant === "icon" ? (
        <svg
          className={sizeClasses[size].icon}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-2.21-.896-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 12a5.983 5.983 0 01-.757 2.829 1 1 0 11-1.415-1.414A3.987 3.987 0 0013 12a3.987 3.987 0 00-.172-1.415 1 1 0 010-1.414z"
            clipRule="evenodd"
          />
          <path d="M13.293 7.293a1 1 0 011.414 0L16 8.586l1.293-1.293a1 1 0 111.414 1.414L17.414 10l1.293 1.293a1 1 0 01-1.414 1.414L16 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L14.586 10l-1.293-1.293a1 1 0 010-1.414z" />
        </svg>
      ) : (
        "Audio Only"
      );
    tooltip = "No lyrics available";
  }

  const baseClasses = "inline-flex items-center rounded-full font-medium";
  const classes = `${baseClasses} ${sizeClasses[size][variant]} ${stateClasses} ${className}`;

  if (variant === "badge") {
    return (
      <span className={classes} title={tooltip}>
        {content}
      </span>
    );
  }

  if (variant === "icon") {
    return (
      <span className={classes} title={tooltip}>
        {content}
      </span>
    );
  }

  if (variant === "text") {
    return (
      <span
        className={`${sizeClasses[size][variant]} ${stateClasses.replace(/bg-\w+-\d+|border-\w+-\d+/g, "")} ${className}`}
        title={tooltip}
      >
        {content}
      </span>
    );
  }

  return null;
}
