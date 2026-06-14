import { MediaItem } from "@/types";
import { SearchState } from "@/hooks/useSearchState";
import { UseSearchActionsReturn } from "@/hooks/useSearchActions";

// --- Standalone handler functions ---

export function buildConfirmationSuccess(song: MediaItem): string {
  const truncatedTitle =
    song.title.length > 40 ? `${song.title.substring(0, 40)}...` : song.title;
  return `"${truncatedTitle}" by ${song.artist} added to queue!`;
}

export function buildConfirmationError(err: unknown): string {
  const errorMessage =
    err instanceof Error ? err.message : "Failed to add song to queue";
  if (errorMessage.includes("join a session first")) {
    return "You must join a session first. Please refresh the page and try again.";
  }
  return errorMessage;
}

export type LoadMoreDispatcher = (
  state: SearchState,
  actions: UseSearchActionsReturn
) => Promise<void>;

/** Determines which fetch to call based on current view state. */
export async function dispatchLoadMore(
  state: SearchState,
  actions: UseSearchActionsReturn
): Promise<void> {
  const nextPage = state.currentPage + 1;

  if (state.activeTab === "search") {
    return dispatchSearchTabLoadMore(state, actions, nextPage);
  }
  if (state.activeTab === "playlist") {
    return dispatchPlaylistTabLoadMore(state, actions, nextPage);
  }
}

async function dispatchSearchTabLoadMore(
  state: SearchState,
  actions: UseSearchActionsReturn,
  nextPage: number
): Promise<void> {
  if (state.artistViewMode === "artists") {
    if (state.searchQuery.trim()) {
      await actions.performUnifiedSearch(state.searchQuery, nextPage, true);
    } else {
      await actions.loadMoreArtists(nextPage, true);
    }
    return;
  }
  if (state.selectedArtist) {
    await actions.getSongsByArtist(state.selectedArtist, nextPage, true);
    return;
  }
  if (state.selectedAlbum) {
    await actions.getSongsByAlbum(state.selectedAlbum, nextPage, true);
  }
}

async function dispatchPlaylistTabLoadMore(
  state: SearchState,
  actions: UseSearchActionsReturn,
  nextPage: number
): Promise<void> {
  if (state.playlistViewMode === "playlists") {
    await actions.getPlaylists(nextPage, true);
    return;
  }
  if (state.selectedPlaylist) {
    await actions.getSongsByPlaylist(state.selectedPlaylist, nextPage, true);
  }
}
