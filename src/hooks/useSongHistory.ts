"use client";

import { useState, useEffect, useCallback } from "react";
import { MediaItem } from "@/types";

export interface SongHistoryEntry {
  mediaItem: MediaItem;
  lastSungAt: string;
  isFavorite: boolean;
}

const STORAGE_KEY_PREFIX = "karaoke-song-history-";

function getStorageKey(userName: string): string {
  return `${STORAGE_KEY_PREFIX}${userName}`;
}

function loadHistory(userName: string): SongHistoryEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(getStorageKey(userName));
  if (!raw) return [];
  return JSON.parse(raw);
}

function saveHistory(userName: string, history: SongHistoryEntry[]): void {
  localStorage.setItem(getStorageKey(userName), JSON.stringify(history));
}

export function useSongHistory(userName: string) {
  const [history, setHistory] = useState<SongHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory(userName));
  }, [userName]);

  const addToHistory = useCallback(
    (mediaItem: MediaItem) => {
      setHistory(prev => {
        const existing = prev.findIndex(
          e => e.mediaItem.jellyfinId === mediaItem.jellyfinId
        );
        let updated: SongHistoryEntry[];

        if (existing >= 0) {
          updated = [...prev];
          updated[existing] = {
            ...updated[existing],
            lastSungAt: new Date().toISOString(),
          };
        } else {
          updated = [
            ...prev,
            {
              mediaItem,
              lastSungAt: new Date().toISOString(),
              isFavorite: false,
            },
          ];
        }

        saveHistory(userName, updated);
        return updated;
      });
    },
    [userName]
  );

  const toggleFavorite = useCallback(
    (jellyfinId: string) => {
      setHistory(prev => {
        const updated = prev.map(entry =>
          entry.mediaItem.jellyfinId === jellyfinId
            ? { ...entry, isFavorite: !entry.isFavorite }
            : entry
        );
        saveHistory(userName, updated);
        return updated;
      });
    },
    [userName]
  );

  const favorites = history.filter(e => e.isFavorite);
  const recentHistory = [...history]
    .sort(
      (a, b) =>
        new Date(b.lastSungAt).getTime() - new Date(a.lastSungAt).getTime()
    )
    .filter(e => !e.isFavorite);

  return { history, favorites, recentHistory, addToHistory, toggleFavorite };
}
