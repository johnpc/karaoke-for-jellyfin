"use client";

import { Fragment } from "react";
import { LyricsWord } from "@/types";
import { useSmoothedTime } from "@/hooks/useSmoothedTime";

/** Used for the last word when the line end is unknown */
export const DEFAULT_WORD_MS = 600;

export type WordState = "sung" | "current" | "upcoming";

/** End of a word = start of the next word, else line end, else a default */
export function getWordEndMs(
  words: LyricsWord[],
  index: number,
  lineEndMs?: number
): number {
  const next = words[index + 1];
  if (next) return next.startMs;
  const startMs = words[index].startMs;
  if (lineEndMs !== undefined && lineEndMs > startMs) return lineEndMs;
  return startMs + DEFAULT_WORD_MS;
}

export function getWordState(
  startMs: number,
  endMs: number,
  nowMs: number
): WordState {
  if (nowMs >= endMs) return "sung";
  if (nowMs >= startMs) return "current";
  return "upcoming";
}

/** 0..1 fill fraction of the current word */
export function getWordProgress(
  startMs: number,
  endMs: number,
  nowMs: number
): number {
  if (endMs <= startMs) return nowMs >= startMs ? 1 : 0;
  return Math.min(1, Math.max(0, (nowMs - startMs) / (endMs - startMs)));
}

const STATE_CLASS: Record<WordState, string> = {
  sung: "text-white",
  current: "text-transparent bg-clip-text",
  upcoming: "text-white/40",
};

interface LyricWordSpanProps {
  word: string;
  state: WordState;
  progress: number;
}

function LyricWordSpan({ word, state, progress }: LyricWordSpanProps) {
  const pct = Math.round(progress * 100);
  const style =
    state === "current"
      ? {
          backgroundImage: `linear-gradient(90deg, #ffffff ${pct}%, rgba(255,255,255,0.4) ${pct}%)`,
          WebkitBackgroundClip: "text",
        }
      : undefined;

  return (
    <span
      data-testid="lyric-word"
      data-state={state}
      className={`transition-colors duration-150 ${STATE_CLASS[state]}`}
      style={style}
    >
      {word}
    </span>
  );
}

interface LyricsWordsProps {
  words: LyricsWord[];
  lineEndMs?: number;
  currentTime: number; // seconds, lyrics offset already applied
  isPlaying: boolean;
}

/**
 * Renders an Enhanced LRC line word by word: sung words are bright, upcoming
 * words are dimmed, and the current word fills left-to-right in time with
 * the playback clock.
 */
export function LyricsWords({
  words,
  lineEndMs,
  currentTime,
  isPlaying,
}: LyricsWordsProps) {
  const nowMs = useSmoothedTime(currentTime, isPlaying) * 1000;

  return (
    <span data-testid="lyric-words">
      {words.map((word, index) => {
        const endMs = getWordEndMs(words, index, lineEndMs);
        return (
          <Fragment key={`${word.startMs}-${index}`}>
            {index > 0 && " "}
            <LyricWordSpan
              word={word.word}
              state={getWordState(word.startMs, endMs, nowMs)}
              progress={getWordProgress(word.startMs, endMs, nowMs)}
            />
          </Fragment>
        );
      })}
    </span>
  );
}
