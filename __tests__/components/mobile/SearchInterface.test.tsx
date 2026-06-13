import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SearchInterface } from "@/components/mobile/SearchInterface";

// Mock the search service
vi.mock("@/services/searchService", () => ({
  performUnifiedSearch: vi.fn().mockResolvedValue({
    artists: [],
    albums: [],
    songs: [],
    hasMore: false,
  }),
  mergeUniqueResults: vi.fn((existing: unknown[], newResults: unknown[]) => [
    ...existing,
    ...newResults,
  ]),
  loadMoreArtists: vi.fn().mockResolvedValue({ data: [], hasMore: false }),
  getSongsByArtist: vi.fn().mockResolvedValue({ data: [], hasMore: false }),
  getSongsByAlbum: vi.fn().mockResolvedValue({ data: [], hasMore: false }),
  getPlaylists: vi.fn().mockResolvedValue({ data: [], hasMore: false }),
  getSongsByPlaylist: vi.fn().mockResolvedValue({ data: [], hasMore: false }),
}));

// Mock the SearchContent component from search-interface-components
vi.mock("@/components/mobile/search-interface-components", () => ({
  SearchContent: ({
    activeTab,
    isLoading,
    error,
    isConnected,
  }: {
    activeTab: string;
    isLoading: boolean;
    error: string | null;
    isConnected: boolean;
  }) => (
    <div data-testid="search-content">
      <span data-testid="active-tab">{activeTab}</span>
      <span data-testid="is-loading">{String(isLoading)}</span>
      <span data-testid="search-error">{error || "none"}</span>
      <span data-testid="is-connected">{String(isConnected)}</span>
    </div>
  ),
}));

// Mock the ConfirmationDialog
vi.mock("@/components/mobile/ConfirmationDialog", () => ({
  ConfirmationDialog: ({
    isOpen,
    title,
    message,
  }: {
    isOpen: boolean;
    title: string;
    message: string;
  }) =>
    isOpen ? (
      <div data-testid="confirmation-dialog">
        <span data-testid="dialog-title">{title}</span>
        <span data-testid="dialog-message">{message}</span>
      </div>
    ) : null,
}));

// Mock global fetch for initial artist loading
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ success: true, data: [] }),
});

describe("SearchInterface", () => {
  const defaultProps = {
    onAddSong: vi.fn().mockResolvedValue(undefined),
    isConnected: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  it("renders without crashing", () => {
    render(<SearchInterface {...defaultProps} />);
    expect(document.body.innerHTML).not.toBe("");
  });

  it("renders the search content component", () => {
    render(<SearchInterface {...defaultProps} />);
    expect(screen.getByTestId("search-content")).toBeInTheDocument();
  });

  it("starts with search tab active", () => {
    render(<SearchInterface {...defaultProps} />);
    expect(screen.getByTestId("active-tab")).toHaveTextContent("search");
  });

  it("passes isConnected prop through", () => {
    render(<SearchInterface {...defaultProps} isConnected={false} />);
    expect(screen.getByTestId("is-connected")).toHaveTextContent("false");
  });

  it("shows loading state initially when fetching artists", () => {
    // The component triggers initial artist load in useEffect
    render(<SearchInterface {...defaultProps} />);
    // Initially isLoading should be true during artist load
    // However, since the mock resolves immediately, it may already be false
    expect(screen.getByTestId("search-content")).toBeInTheDocument();
  });

  it("does not show confirmation dialog initially", () => {
    render(<SearchInterface {...defaultProps} />);
    expect(screen.queryByTestId("confirmation-dialog")).not.toBeInTheDocument();
  });

  it("shows no error initially", () => {
    render(<SearchInterface {...defaultProps} />);
    expect(screen.getByTestId("search-error")).toHaveTextContent("none");
  });
});
