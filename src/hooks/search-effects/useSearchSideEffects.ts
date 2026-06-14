"use client";

import { useEffect } from "react";
import { fetchArtists } from "@/services/searchFetchers";
import { SearchState, SearchStateSetters } from "@/hooks/useSearchState";
import { UseSearchActionsReturn } from "@/hooks/useSearchActions";

/** Debounces the search input and triggers a unified search for non-empty queries. */
export function useSearchDebounce(
  state: SearchState,
  actions: UseSearchActionsReturn
): void {
  useEffect(() => {
    if (!state.searchQuery.trim()) return;

    const timeoutId = setTimeout(() => {
      if (state.activeTab === "search" && state.artistViewMode === "artists") {
        actions.performUnifiedSearch(state.searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.searchQuery, state.activeTab, state.artistViewMode]);
}

/** Loads the initial artist list when the search tab first mounts. */
export function useInitialArtistLoad(
  state: SearchState,
  setters: SearchStateSetters
): void {
  useEffect(() => {
    const loadInitialArtists = async () => {
      setters.setIsLoading(true);
      setters.setHasSearched(true);
      try {
        const result = await fetchArtists(1);
        setters.setArtistResults(result.data);
        setters.setHasMoreResults(result.hasMore);
        setters.setCurrentPage(1);
      } catch (err) {
        console.error("Failed to load initial artists:", err);
        const msg =
          err instanceof Error ? err.message : "Failed to connect to server";
        setters.setError(msg);
      } finally {
        setters.setIsLoading(false);
      }
    };

    if (
      !state.hasSearched &&
      state.activeTab === "search" &&
      state.artistViewMode === "artists"
    ) {
      loadInitialArtists();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.hasSearched, state.activeTab, state.artistViewMode]);
}
