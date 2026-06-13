import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SongResults } from "@/components/mobile/search-interface-components/SongResults";
import { MediaItem } from "@/types";

vi.mock("@/components/LyricsIndicator", () => ({
  LyricsIndicator: ({ song }: { song: MediaItem }) => (
    <span data-testid="lyrics-indicator">
      {song.hasLyrics ? "Karaoke" : "Audio Only"}
    </span>
  ),
}));

const mockSongs: MediaItem[] = [
  {
    id: "song-1",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    album: "A Night at the Opera",
    duration: 354,
    jellyfinId: "j1",
    streamUrl: "/stream/1",
    hasLyrics: true,
  },
  {
    id: "song-2",
    title: "Stairway to Heaven",
    artist: "Led Zeppelin",
    duration: 482,
    jellyfinId: "j2",
    streamUrl: "/stream/2",
    hasLyrics: false,
  },
];

describe("SongResults", () => {
  const defaultProps = {
    songs: mockSongs,
    isCollapsed: false,
    onToggleCollapse: vi.fn(),
    onAddSong: vi.fn(),
    addingSongId: null,
    isConnected: true,
    showHeader: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when songs array is empty", () => {
    const { container } = render(<SongResults {...defaultProps} songs={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders song items", () => {
    render(<SongResults {...defaultProps} />);
    expect(screen.getByText("Bohemian Rhapsody")).toBeInTheDocument();
    expect(screen.getByText("Stairway to Heaven")).toBeInTheDocument();
  });

  it("displays artist and album info", () => {
    render(<SongResults {...defaultProps} />);
    expect(screen.getByText(/Queen/)).toBeInTheDocument();
    expect(screen.getByText(/A Night at the Opera/)).toBeInTheDocument();
  });

  it("formats duration correctly", () => {
    render(<SongResults {...defaultProps} />);
    expect(screen.getByText("5:54")).toBeInTheDocument(); // 354 seconds
    expect(screen.getByText("8:02")).toBeInTheDocument(); // 482 seconds
  });

  it("shows header with song count when showHeader is true", () => {
    render(<SongResults {...defaultProps} />);
    expect(screen.getByText("Songs (2)")).toBeInTheDocument();
  });

  it("hides header when showHeader is false", () => {
    render(<SongResults {...defaultProps} showHeader={false} />);
    expect(screen.queryByText("Songs (2)")).not.toBeInTheDocument();
  });

  it("calls onToggleCollapse when header is clicked", () => {
    const onToggleCollapse = vi.fn();
    render(
      <SongResults {...defaultProps} onToggleCollapse={onToggleCollapse} />
    );

    fireEvent.click(screen.getByText("Songs (2)"));
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it("hides song list when collapsed", () => {
    render(<SongResults {...defaultProps} isCollapsed={true} />);
    expect(screen.queryByText("Bohemian Rhapsody")).not.toBeInTheDocument();
  });

  it("calls onAddSong when add button is clicked", () => {
    const onAddSong = vi.fn();
    render(<SongResults {...defaultProps} onAddSong={onAddSong} />);

    const addButtons = screen.getAllByTestId("add-song-button");
    fireEvent.click(addButtons[0]);
    expect(onAddSong).toHaveBeenCalledWith(mockSongs[0]);
  });

  it("disables add button when not connected", () => {
    render(<SongResults {...defaultProps} isConnected={false} />);
    const addButtons = screen.getAllByTestId("add-song-button");
    expect(addButtons[0]).toBeDisabled();
  });

  it("disables add button when song is being added", () => {
    render(<SongResults {...defaultProps} addingSongId="song-1" />);
    const addButtons = screen.getAllByTestId("add-song-button");
    expect(addButtons[0]).toBeDisabled();
  });

  it("shows loading spinner for song being added", () => {
    render(<SongResults {...defaultProps} addingSongId="song-1" />);
    expect(screen.getByTestId("add-song-loading")).toBeInTheDocument();
  });
});
