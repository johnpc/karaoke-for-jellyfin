import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ArtistResults } from "@/components/mobile/search-interface-components/ArtistResults";
import { Artist } from "@/types";

const mockArtists: Artist[] = [
  {
    id: "artist-1",
    name: "Queen",
    jellyfinId: "j-artist-1",
    imageUrl: "http://example.com/queen.jpg",
  },
  {
    id: "artist-2",
    name: "Led Zeppelin",
    jellyfinId: "j-artist-2",
  },
];

describe("ArtistResults", () => {
  const defaultProps = {
    artists: mockArtists,
    isCollapsed: false,
    onToggleCollapse: vi.fn(),
    onArtistSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when artists array is empty", () => {
    const { container } = render(
      <ArtistResults {...defaultProps} artists={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders artist items", () => {
    render(<ArtistResults {...defaultProps} />);
    expect(screen.getByText("Queen")).toBeInTheDocument();
    expect(screen.getByText("Led Zeppelin")).toBeInTheDocument();
  });

  it("shows header with artist count", () => {
    render(<ArtistResults {...defaultProps} />);
    expect(screen.getByText("Artists (2)")).toBeInTheDocument();
  });

  it("shows 'Artist' label for each item", () => {
    render(<ArtistResults {...defaultProps} />);
    const labels = screen.getAllByText("Artist");
    expect(labels).toHaveLength(2);
  });

  it("displays artist image when imageUrl is provided", () => {
    render(<ArtistResults {...defaultProps} />);
    const img = screen.getByAltText("Queen");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "http://example.com/queen.jpg");
  });

  it("calls onArtistSelect when an artist is clicked", () => {
    const onArtistSelect = vi.fn();
    render(<ArtistResults {...defaultProps} onArtistSelect={onArtistSelect} />);

    const artistItems = screen.getAllByTestId("artist-item");
    fireEvent.click(artistItems[0]);
    expect(onArtistSelect).toHaveBeenCalledWith(mockArtists[0]);
  });

  it("calls onToggleCollapse when header is clicked", () => {
    const onToggleCollapse = vi.fn();
    render(
      <ArtistResults {...defaultProps} onToggleCollapse={onToggleCollapse} />
    );

    fireEvent.click(screen.getByTestId("collapse-artists"));
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it("hides artist list when collapsed", () => {
    render(<ArtistResults {...defaultProps} isCollapsed={true} />);
    expect(screen.queryByText("Queen")).not.toBeInTheDocument();
    expect(screen.getByTestId("expand-artists")).toBeInTheDocument();
  });
});
