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
  const [isOpen, setIsOpen] = useState(false);
  const [animatingEmoji, setAnimatingEmoji] = useState<string | null>(null);

  const handleTap = (emoji: string) => {
    onReaction(emoji);
    setAnimatingEmoji(emoji);
    setTimeout(() => setAnimatingEmoji(null), 200);
  };

  return (
    <div data-testid="reactions-panel" className="fixed bottom-6 right-4 z-40">
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col gap-2 items-center mb-2">
          {REACTION_EMOJIS.map(emoji => (
            <button
              key={emoji}
              data-testid={`reaction-${emoji}`}
              onClick={() => handleTap(emoji)}
              className={`w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-2xl transition-transform duration-200 active:bg-gray-100 ${
                animatingEmoji === emoji ? "scale-125" : "scale-100"
              }`}
              type="button"
              aria-label={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition-all duration-200 ${
          isOpen
            ? "bg-gray-700 text-white rotate-45"
            : "bg-purple-600 text-white"
        }`}
        aria-label={isOpen ? "Close reactions" : "Open reactions"}
      >
        {isOpen ? "+" : "🎉"}
      </button>
    </div>
  );
}
