"use client";

import { LyricsFile, LyricsWord } from "@/types";
import { LyricsWords } from "@/components/tv/LyricsWords";

interface LyricsContentProps {
  currentLine: string;
  currentLineWords?: LyricsWord[];
  currentLineEndMs?: number;
  currentTime?: number; // seconds, lyrics offset already applied
  isPlaying?: boolean;
  nextLine: string;
  lyricsError: string | null;
  lyricsLoading: boolean;
  lyricsFile: LyricsFile | null;
  hasLyricsPath: boolean;
}

export function LyricsContent({
  currentLine,
  currentLineWords,
  currentLineEndMs,
  currentTime = 0,
  isPlaying = false,
  nextLine,
  lyricsError,
  lyricsLoading,
  lyricsFile,
  hasLyricsPath,
}: LyricsContentProps) {
  return (
    <div className="text-center z-10 max-w-5xl mx-auto flex-1 flex flex-col justify-center">
      <div className="mb-8">
        <div
          data-testid="current-lyric"
          className="text-6xl font-bold text-white leading-relaxed mb-6 min-h-[160px] flex items-center justify-center px-4"
        >
          {currentLineWords && currentLineWords.length > 0 ? (
            <LyricsWords
              words={currentLineWords}
              lineEndMs={currentLineEndMs}
              currentTime={currentTime}
              isPlaying={isPlaying}
            />
          ) : (
            currentLine
          )}
        </div>

        {nextLine && (
          <div className="text-3xl text-gray-400 opacity-70 leading-relaxed">
            {nextLine}
          </div>
        )}
      </div>

      {lyricsError && (
        <div className="text-2xl text-red-400 italic">{lyricsError}</div>
      )}

      {!hasLyricsPath && !lyricsError && (
        <div className="text-3xl text-gray-500 italic">
          No lyrics available - Enjoy the music!
        </div>
      )}

      {hasLyricsPath && lyricsLoading && !lyricsError && (
        <div className="text-2xl text-gray-400 italic animate-pulse">
          Loading lyrics...
        </div>
      )}

      {lyricsFile?.metadata && (
        <div className="text-xs text-gray-600 mt-6 opacity-50">
          {lyricsFile.metadata.creator && (
            <p>Lyrics by: {lyricsFile.metadata.creator}</p>
          )}
          {lyricsFile.format && (
            <p>Format: {lyricsFile.format.toUpperCase()}</p>
          )}
        </div>
      )}
    </div>
  );
}
