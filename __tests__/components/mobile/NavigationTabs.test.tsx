import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NavigationTabs } from "@/components/mobile/NavigationTabs";

describe("NavigationTabs", () => {
  const mockOnTabChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(
      <NavigationTabs
        activeTab="search"
        onTabChange={mockOnTabChange}
        queueCount={0}
      />
    );

    expect(screen.getByTestId("search-tab")).toBeInTheDocument();
    expect(screen.getByTestId("queue-tab")).toBeInTheDocument();
  });

  it("displays Search Songs and Queue labels", () => {
    render(
      <NavigationTabs
        activeTab="search"
        onTabChange={mockOnTabChange}
        queueCount={0}
      />
    );

    expect(screen.getByText("Search Songs")).toBeInTheDocument();
    expect(screen.getByText("Queue")).toBeInTheDocument();
  });

  it("highlights the active search tab", () => {
    render(
      <NavigationTabs
        activeTab="search"
        onTabChange={mockOnTabChange}
        queueCount={0}
      />
    );

    const searchTab = screen.getByTestId("search-tab");
    expect(searchTab.className).toContain("border-purple-500");
    expect(searchTab.className).toContain("text-purple-600");
  });

  it("highlights the active queue tab", () => {
    render(
      <NavigationTabs
        activeTab="queue"
        onTabChange={mockOnTabChange}
        queueCount={0}
      />
    );

    const queueTab = screen.getByTestId("queue-tab");
    expect(queueTab.className).toContain("border-purple-500");
    expect(queueTab.className).toContain("text-purple-600");
  });

  it("calls onTabChange with 'search' when search tab is clicked", () => {
    render(
      <NavigationTabs
        activeTab="queue"
        onTabChange={mockOnTabChange}
        queueCount={0}
      />
    );

    fireEvent.click(screen.getByTestId("search-tab"));

    expect(mockOnTabChange).toHaveBeenCalledWith("search");
  });

  it("calls onTabChange with 'queue' when queue tab is clicked", () => {
    render(
      <NavigationTabs
        activeTab="search"
        onTabChange={mockOnTabChange}
        queueCount={0}
      />
    );

    fireEvent.click(screen.getByTestId("queue-tab"));

    expect(mockOnTabChange).toHaveBeenCalledWith("queue");
  });

  it("shows queue count badge when queueCount > 0", () => {
    render(
      <NavigationTabs
        activeTab="search"
        onTabChange={mockOnTabChange}
        queueCount={5}
      />
    );

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("does not show queue count badge when queueCount is 0", () => {
    render(
      <NavigationTabs
        activeTab="search"
        onTabChange={mockOnTabChange}
        queueCount={0}
      />
    );

    // The badge should not be present
    const queueTab = screen.getByTestId("queue-tab");
    expect(queueTab.querySelector(".bg-purple-600")).not.toBeInTheDocument();
  });

  it("shows large queue count", () => {
    render(
      <NavigationTabs
        activeTab="search"
        onTabChange={mockOnTabChange}
        queueCount={99}
      />
    );

    expect(screen.getByText("99")).toBeInTheDocument();
  });
});
