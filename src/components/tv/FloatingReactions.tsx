"use client";

import { useMemo } from "react";
import { Reaction } from "@/hooks/useReactions";

interface FloatingReactionsProps {
  reactions: Reaction[];
}

export function FloatingReactions({ reactions }: FloatingReactionsProps) {
  // Generate stable random horizontal positions per reaction ID
  const positions = useMemo(() => {
    const map = new Map<string, number>();
    reactions.forEach(r => {
      if (!map.has(r.id)) {
        // Simple hash from ID to get a pseudo-random position 5-95%
        const hash = r.id
          .split("")
          .reduce((acc, char) => acc + char.charCodeAt(0), 0);
        map.set(r.id, 5 + (hash % 90));
      }
    });
    return map;
  }, [reactions]);

  if (reactions.length === 0) return null;

  return (
    <div
      data-testid="floating-reactions-container"
      className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
    >
      {reactions.map(reaction => (
        <span
          key={reaction.id}
          data-testid="floating-reaction"
          className="absolute bottom-0 text-5xl animate-float-up"
          style={{ left: `${positions.get(reaction.id) ?? 50}%` }}
        >
          {reaction.emoji}
        </span>
      ))}
    </div>
  );
}
