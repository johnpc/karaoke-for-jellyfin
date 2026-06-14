"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Socket } from "socket.io-client";

export interface Reaction {
  id: string;
  emoji: string;
  timestamp: number;
}

interface UseReactionsReturn {
  reactions: Reaction[];
}

const REACTION_LIFETIME_MS = 3500;

export function useReactions(socket: Socket | null): UseReactionsReturn {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const removeReaction = useCallback((id: string) => {
    setReactions(prev => prev.filter(r => r.id !== id));
    timersRef.current.delete(id);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleReaction = (data: { id: string; emoji: string }) => {
      const reaction: Reaction = {
        id: data.id,
        emoji: data.emoji,
        timestamp: Date.now(),
      };

      setReactions(prev => [...prev, reaction]);

      const timer = setTimeout(() => {
        removeReaction(reaction.id);
      }, REACTION_LIFETIME_MS);

      timersRef.current.set(reaction.id, timer);
    };

    socket.on("reaction-received", handleReaction);

    return () => {
      socket.off("reaction-received", handleReaction);
    };
  }, [socket, removeReaction]);

  // Clean up all timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return { reactions };
}
