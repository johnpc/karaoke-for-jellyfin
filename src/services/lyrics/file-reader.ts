// File I/O: reading and locating lyrics files on disk
import { LyricsFile, LyricsFormat } from "@/types";
import { promises as fs } from "fs";
import path from "path";

import { parseLRC } from "./parse-lrc";
import { parseSRT, parseVTT, parsePlainText } from "./parse-timed";

/**
 * Read and parse a lyrics file from disk based on its format
 */
export async function parseLyricsFile(
  filePath: string,
  format: LyricsFormat
): Promise<LyricsFile | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const songId = path.basename(filePath, path.extname(filePath));

    switch (format) {
      case "lrc":
        return parseLRC(content, songId);
      case "srt":
        return parseSRT(content, songId);
      case "vtt":
        return parseVTT(content, songId);
      case "txt":
        return parsePlainText(content, songId);
      default:
        throw new Error(`Unsupported lyrics format: ${format}`);
    }
  } catch (error) {
    console.error(`Failed to parse lyrics file ${filePath}:`, error);
    return null;
  }
}

/**
 * Search for a lyrics file across multiple directories
 */
export async function findLyricsFile(
  songId: string,
  searchPaths: string[]
): Promise<string | null> {
  const extensions = [".lrc", ".srt", ".vtt", ".txt"];

  for (const searchPath of searchPaths) {
    for (const ext of extensions) {
      const filePath = path.join(searchPath, `${songId}${ext}`);
      try {
        await fs.access(filePath);
        return filePath;
      } catch {
        // File doesn't exist, continue searching
      }
    }
  }
  return null;
}

/**
 * Determine LyricsFormat from a file extension string
 */
export function formatFromExtension(ext: string): LyricsFormat | null {
  const formatMap: Record<string, LyricsFormat> = {
    ".lrc": "lrc",
    ".srt": "srt",
    ".vtt": "vtt",
    ".txt": "txt",
  };
  return formatMap[ext.toLowerCase()] || null;
}
