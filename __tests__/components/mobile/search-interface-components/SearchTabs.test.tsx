import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchTabs } from "@/components/mobile/search-interface-components/SearchTabs";

describe("SearchTabs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders both tabs", () => {
    render(<SearchTabs activeTab="search" onTabChange={vi.fn()} />);
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByText("Playlists")).toBeInTheDocument();
  });

  it("applies active styling to search tab when active", () => {
    render(<SearchTabs activeTab="search" onTabChange={vi.fn()} />);
    const searchButton = screen.getByText("Search");
    expect(searchButton.className).toContain("border-purple-500");
    expect(searchButton.className).toContain("text-purple-600");
  });

  it("applies active styling to playlist tab when active", () => {
    render(<SearchTabs activeTab="playlist" onTabChange={vi.fn()} />);
    const playlistButton = screen.getByTestId("playlist-tab");
    expect(playlistButton.className).toContain("border-purple-500");
    expect(playlistButton.className).toContain("text-purple-600");
  });

  it("calls onTabChange with 'search' when search tab is clicked", () => {
    const onTabChange = vi.fn();
    render(<SearchTabs activeTab="playlist" onTabChange={onTabChange} />);

    fireEvent.click(screen.getByText("Search"));
    expect(onTabChange).toHaveBeenCalledWith("search");
  });

  it("calls onTabChange with 'playlist' when playlists tab is clicked", () => {
    const onTabChange = vi.fn();
    render(<SearchTabs activeTab="search" onTabChange={onTabChange} />);

    fireEvent.click(screen.getByTestId("playlist-tab"));
    expect(onTabChange).toHaveBeenCalledWith("playlist");
  });
});
