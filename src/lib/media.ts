// Media item creation, formatting, and search utilities
import { MediaItem } from "@/types";
import { generateId, formatDuration } from "./validation";

export function createMediaItem(data: {
  title: string;
  artist: string;
  jellyfinId: string;
  streamUrl: string;
  duration: number;
  album?: string;
  lyricsPath?: string;
}): MediaItem {
  return {
    id: `media_${generateId()}`,
    title: data.title.trim(),
    artist: data.artist.trim(),
    album: data.album?.trim(),
    duration: Math.max(0, Math.floor(data.duration)),
    jellyfinId: data.jellyfinId,
    streamUrl: data.streamUrl,
    lyricsPath: data.lyricsPath,
  };
}

export function formatMediaItemDisplay(item: MediaItem): string {
  const duration = formatDuration(item.duration);
  const album = item.album ? ` (${item.album})` : "";
  return `${item.artist} - ${item.title}${album} [${duration}]`;
}

export function searchMediaItems(
  items: MediaItem[],
  query: string
): MediaItem[] {
  if (!query.trim()) return items;

  const searchTerm = query.toLowerCase().trim();

  return items.filter(
    item =>
      item.title.toLowerCase().includes(searchTerm) ||
      item.artist.toLowerCase().includes(searchTerm) ||
      (item.album && item.album.toLowerCase().includes(searchTerm))
  );
}
