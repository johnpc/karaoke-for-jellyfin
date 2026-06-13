import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlaylistResults } from "@/components/mobile/search-interface-components/PlaylistResults";
import { Playlist } from "@/types";

const mockPlaylists: Playlist[] = [
  {
    id: "pl-1",
    name: "Party Mix",
    jellyfinId: "j-pl-1",
    imageUrl: "http://example.com/party.jpg",
    trackCount: 25,
  },
  {
    id: "pl-2",
    name: "Chill Vibes",
    jellyfinId: "j-pl-2",
  },
];

describe("PlaylistResults", () => {
  const defaultProps = {
    playlists: mockPlaylists,
    onPlaylistSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when playlists array is empty", () => {
    const { container } = render(
      <PlaylistResults {...defaultProps} playlists={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders playlist items", () => {
    render(<PlaylistResults {...defaultProps} />);
    expect(screen.getByText("Party Mix")).toBeInTheDocument();
    expect(screen.getByText("Chill Vibes")).toBeInTheDocument();
  });

  it("displays track count when available", () => {
    render(<PlaylistResults {...defaultProps} />);
    expect(screen.getByText("25 songs")).toBeInTheDocument();
  });

  it("displays 'Playlist' when no track count", () => {
    render(<PlaylistResults {...defaultProps} />);
    expect(screen.getByText("Playlist")).toBeInTheDocument();
  });

  it("displays cover image when imageUrl is provided", () => {
    render(<PlaylistResults {...defaultProps} />);
    const img = screen.getByAltText("Party Mix");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "http://example.com/party.jpg");
  });

  it("calls onPlaylistSelect when a playlist is clicked", () => {
    const onPlaylistSelect = vi.fn();
    render(
      <PlaylistResults {...defaultProps} onPlaylistSelect={onPlaylistSelect} />
    );

    const playlistItems = screen.getAllByTestId("playlist-item");
    fireEvent.click(playlistItems[0]);
    expect(onPlaylistSelect).toHaveBeenCalledWith(mockPlaylists[0]);
  });
});
