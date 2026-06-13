import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AlbumResults } from "@/components/mobile/search-interface-components/AlbumResults";
import { Album } from "@/types";

const mockAlbums: Album[] = [
  {
    id: "album-1",
    name: "A Night at the Opera",
    artist: "Queen",
    jellyfinId: "j-album-1",
    imageUrl: "http://example.com/opera.jpg",
    year: 1975,
    trackCount: 12,
  },
  {
    id: "album-2",
    name: "Led Zeppelin IV",
    artist: "Led Zeppelin",
    jellyfinId: "j-album-2",
  },
];

describe("AlbumResults", () => {
  const defaultProps = {
    albums: mockAlbums,
    isCollapsed: false,
    onToggleCollapse: vi.fn(),
    onAlbumSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when albums array is empty", () => {
    const { container } = render(
      <AlbumResults {...defaultProps} albums={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders album items", () => {
    render(<AlbumResults {...defaultProps} />);
    expect(screen.getByText("A Night at the Opera")).toBeInTheDocument();
    expect(screen.getByText("Led Zeppelin IV")).toBeInTheDocument();
  });

  it("shows header with album count", () => {
    render(<AlbumResults {...defaultProps} />);
    expect(screen.getByText("Albums (2)")).toBeInTheDocument();
  });

  it("displays artist and year info", () => {
    render(<AlbumResults {...defaultProps} />);
    expect(screen.getByText(/Queen/)).toBeInTheDocument();
    expect(screen.getByText(/1975/)).toBeInTheDocument();
  });

  it("displays track count when available", () => {
    render(<AlbumResults {...defaultProps} />);
    expect(screen.getByText("12 tracks")).toBeInTheDocument();
  });

  it("displays album cover image when imageUrl is provided", () => {
    render(<AlbumResults {...defaultProps} />);
    const img = screen.getByAltText("A Night at the Opera");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "http://example.com/opera.jpg");
  });

  it("calls onAlbumSelect when an album is clicked", () => {
    const onAlbumSelect = vi.fn();
    render(<AlbumResults {...defaultProps} onAlbumSelect={onAlbumSelect} />);

    const albumItems = screen.getAllByRole("button").length; // header button
    // Click the first album div (not the header button)
    const albumDivs = screen
      .getByText("A Night at the Opera")
      .closest("[class*='cursor-pointer']");
    fireEvent.click(albumDivs!);
    expect(onAlbumSelect).toHaveBeenCalledWith(mockAlbums[0]);
  });

  it("calls onToggleCollapse when header is clicked", () => {
    const onToggleCollapse = vi.fn();
    render(
      <AlbumResults {...defaultProps} onToggleCollapse={onToggleCollapse} />
    );

    fireEvent.click(screen.getByText("Albums (2)"));
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it("hides album list when collapsed", () => {
    render(<AlbumResults {...defaultProps} isCollapsed={true} />);
    expect(screen.queryByText("A Night at the Opera")).not.toBeInTheDocument();
  });
});
