import * as SearchService from "@/services/searchService";
import {
  UnifiedSearchContext,
  clearUnifiedResults,
  applyUnifiedResults,
} from "./types";

export async function executeUnifiedSearch(
  ctx: UnifiedSearchContext,
  query: string,
  page: number = 1,
  append: boolean = false
): Promise<void> {
  if (!query.trim()) {
    clearUnifiedResults(ctx);
    return;
  }
  if (page === 1) {
    ctx.setIsLoading(true);
    if (!append) {
      ctx.setSongResults([]);
      ctx.setArtistResults([]);
      ctx.setAlbumResults([]);
    }
  } else {
    ctx.setIsLoadingMore(true);
  }
  ctx.setError(null);
  ctx.setHasSearched(true);
  try {
    const results = await SearchService.performUnifiedSearch({ query, page });
    applyUnifiedResults(ctx, results, append, page);
  } catch (err) {
    console.error("Unified search wrapper error:", err);
    ctx.setError("Failed to connect to server");
    if (!append) {
      ctx.setSongResults([]);
      ctx.setArtistResults([]);
      ctx.setAlbumResults([]);
    }
  } finally {
    ctx.setIsLoading(false);
    ctx.setIsLoadingMore(false);
  }
}
