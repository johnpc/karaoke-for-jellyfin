"use client";

import { useState } from "react";

interface ReactionsPanelProps {
  onReaction: (emoji: string) => void;
}

const REACTION_EMOJIS = [
  "\u{1F525}",
  "❤️",
  "\u{1F3A4}",
  "\u{1F44F}",
  "\u{1F602}",
  "\u{1F64C}",
] as const;

export function ReactionsPanel({ onReaction }: ReactionsPanelProps) {
  const [animatingEmoji, setAnimatingEmoji] = useState<string | null>(null);

  const handleTap = (emoji: string) => {
    onReaction(emoji);
    setAnimatingEmoji(emoji);
    setTimeout(() => setAnimatingEmoji(null), 200);
  };

  return (
    <div
      data-testid="reactions-panel"
      className="bg-white rounded-lg p-3 shadow-sm border"
    >
      <div className="flex items-center justify-around">
        {REACTION_EMOJIS.map(emoji => (
          <button
            key={emoji}
            data-testid={`reaction-${emoji}`}
            onClick={() => handleTap(emoji)}
            className={`text-2xl p-2 rounded-full active:bg-gray-100 transition-transform duration-200 ${
              animatingEmoji === emoji ? "scale-125" : "scale-100"
            }`}
            type="button"
            aria-label={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
