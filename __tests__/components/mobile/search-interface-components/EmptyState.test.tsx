import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmptyState } from "@/components/mobile/search-interface-components/EmptyState";

describe("EmptyState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when hasSearched is false", () => {
    const { container } = render(
      <EmptyState type="search" hasSearched={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders search empty state", () => {
    render(<EmptyState type="search" hasSearched={true} />);
    expect(screen.getByTestId("no-results")).toBeInTheDocument();
    expect(screen.getByText("No results found")).toBeInTheDocument();
    expect(
      screen.getByText("Try searching for a different artist, song, or album")
    ).toBeInTheDocument();
  });

  it("renders playlist empty state", () => {
    render(<EmptyState type="playlist" hasSearched={true} />);
    expect(screen.getByText("No playlists found")).toBeInTheDocument();
    expect(screen.getByText("Try a different search term")).toBeInTheDocument();
  });

  it("renders songs empty state", () => {
    render(<EmptyState type="songs" hasSearched={true} />);
    expect(screen.getByText("No songs found")).toBeInTheDocument();
    expect(
      screen.getByText("This collection appears to be empty")
    ).toBeInTheDocument();
  });
});
