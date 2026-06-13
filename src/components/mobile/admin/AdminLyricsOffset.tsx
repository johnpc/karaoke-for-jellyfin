"use client";

import { PlaybackState, PlaybackCommand } from "@/types";

interface AdminLyricsOffsetProps {
  playbackState: PlaybackState | null;
  onPlaybackControl: (command: PlaybackCommand) => void;
}

export function AdminLyricsOffset({
  playbackState,
  onPlaybackControl,
}: AdminLyricsOffsetProps) {
  const currentOffset = playbackState?.lyricsOffset || 0;

  const handleLyricsOffsetChange = (offset: number) => {
    const clampedOffset = Math.max(-10, Math.min(10, offset));
    console.log("Sending lyrics offset change:", clampedOffset);
    onPlaybackControl({
      action: "lyrics-offset",
      value: clampedOffset,
      userId: "mobile-admin",
      timestamp: new Date(),
    });
  };

  return (
    <>
      <div
        data-testid="lyrics-timing"
        className="bg-white rounded-lg p-4 shadow-sm border"
      >
        <h3 className="text-sm font-medium text-gray-500 mb-4">
          Lyrics Timing
        </h3>

        <div className="flex items-center space-x-3">
          <button
            data-testid="lyrics-offset-minus"
            onClick={() => handleLyricsOffsetChange(currentOffset - 1)}
            className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentOffset <= -10}
          >
            <span className="text-lg font-bold text-gray-700">{"−"}</span>
          </button>

          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>-10s</span>
              <span className="font-medium">
                {currentOffset > 0 ? "+" : ""}
                {currentOffset}s
              </span>
              <span>+10s</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="-10"
                max="10"
                step="1"
                value={currentOffset}
                onChange={e =>
                  handleLyricsOffsetChange(parseInt(e.target.value))
                }
                className="lyrics-offset-slider w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right,
                    #ef4444 0%,
                    #ef4444 ${((currentOffset + 10) / 20) * 50}%,
                    #22c55e ${((currentOffset + 10) / 20) * 50}%,
                    #22c55e 50%,
                    #3b82f6 50%,
                    #3b82f6 100%)`,
                }}
              />
              {/* Center marker */}
              <div className="absolute top-0 left-1/2 transform -translate-x-px w-0.5 h-2 bg-gray-400 pointer-events-none"></div>
            </div>
            <div className="text-xs text-gray-400 mt-1 text-center">
              Adjust if lyrics appear too early (-) or too late (+)
            </div>
            {currentOffset !== 0 && (
              <div className="flex justify-center mt-2">
                <button
                  onClick={() => handleLyricsOffsetChange(0)}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  Reset to 0s
                </button>
              </div>
            )}
          </div>

          <button
            data-testid="lyrics-offset-plus"
            onClick={() => handleLyricsOffsetChange(currentOffset + 1)}
            className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentOffset >= 10}
          >
            <span className="text-lg font-bold text-gray-700">+</span>
          </button>
        </div>
      </div>

      {/* Custom styles for the lyrics offset slider */}
      <style jsx>{`
        .lyrics-offset-slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .lyrics-offset-slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .lyrics-offset-slider:focus {
          outline: none;
        }
        .lyrics-offset-slider:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.3);
        }
      `}</style>
    </>
  );
}
