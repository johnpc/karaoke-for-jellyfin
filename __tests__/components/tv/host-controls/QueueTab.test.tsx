import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueueTab } from "@/components/tv/host-controls/QueueTab";
import { QueueItem } from "@/types";

const createQueueItem = (overrides: Partial<QueueItem> = {}): QueueItem => ({
  id: "queue-1",
  mediaItem: {
    id: "song-1",
    title: "Test Song",
    artist: "Test Artist",
    duration: 240,
    jellyfinId: "jellyfin-1",
    streamUrl: "http://test.com/stream/1",
  },
  addedBy: "John",
  addedAt: new Date(),
  position: 0,
  status: "pending",
  ...overrides,
});

describe("QueueTab", () => {
  const mockOnRemoveSong = vi.fn();
  const mockOnReorderQueue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("empty queue", () => {
    it("shows empty state message when queue is empty", () => {
      render(<QueueTab pendingQueue={[]} />);

      expect(screen.getByText("No songs in queue")).toBeInTheDocument();
    });

    it("shows the QueueListIcon area", () => {
      const { container } = render(<QueueTab pendingQueue={[]} />);

      // The empty state has a centered text
      expect(container.querySelector(".text-center")).toBeInTheDocument();
    });
  });

  describe("populated queue", () => {
    const queue = [
      createQueueItem({ id: "q1", position: 0 }),
      createQueueItem({
        id: "q2",
        position: 1,
        mediaItem: {
          id: "song-2",
          title: "Second Song",
          artist: "Another Artist",
          duration: 180,
          jellyfinId: "jf-2",
          streamUrl: "/stream/2",
        },
        addedBy: "Alice",
      }),
    ];

    it("renders all queue items", () => {
      render(
        <QueueTab
          pendingQueue={queue}
          onRemoveSong={mockOnRemoveSong}
          onReorderQueue={mockOnReorderQueue}
        />
      );

      expect(screen.getByText("Test Song")).toBeInTheDocument();
      expect(screen.getByText("Second Song")).toBeInTheDocument();
    });

    it("shows song artists", () => {
      render(<QueueTab pendingQueue={queue} />);

      expect(screen.getByText("Test Artist")).toBeInTheDocument();
      expect(screen.getByText("Another Artist")).toBeInTheDocument();
    });

    it("shows who added each song", () => {
      render(<QueueTab pendingQueue={queue} />);

      expect(screen.getByText("John")).toBeInTheDocument();
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    it("shows song duration", () => {
      render(<QueueTab pendingQueue={queue} />);

      expect(screen.getByText("4:00")).toBeInTheDocument(); // 240 seconds
      expect(screen.getByText("3:00")).toBeInTheDocument(); // 180 seconds
    });

    it("shows position numbers", () => {
      render(<QueueTab pendingQueue={queue} />);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("does not show empty state", () => {
      render(<QueueTab pendingQueue={queue} />);

      expect(screen.queryByText("No songs in queue")).not.toBeInTheDocument();
    });
  });

  describe("remove button", () => {
    const queue = [createQueueItem({ id: "q1" })];

    it("renders remove button when onRemoveSong is provided", () => {
      render(<QueueTab pendingQueue={queue} onRemoveSong={mockOnRemoveSong} />);

      const removeBtn = screen.getByTitle("Remove from queue");
      expect(removeBtn).toBeInTheDocument();
    });

    it("does not render remove button when onRemoveSong is not provided", () => {
      render(<QueueTab pendingQueue={queue} />);

      expect(screen.queryByTitle("Remove from queue")).not.toBeInTheDocument();
    });

    it("calls onRemoveSong with item id when clicked", () => {
      render(<QueueTab pendingQueue={queue} onRemoveSong={mockOnRemoveSong} />);

      fireEvent.click(screen.getByTitle("Remove from queue"));

      expect(mockOnRemoveSong).toHaveBeenCalledWith("q1");
    });
  });

  describe("drag and drop", () => {
    const queue = [
      createQueueItem({ id: "q1", position: 0 }),
      createQueueItem({
        id: "q2",
        position: 1,
        mediaItem: {
          id: "song-2",
          title: "Second Song",
          artist: "Another Artist",
          duration: 180,
          jellyfinId: "jf-2",
          streamUrl: "/stream/2",
        },
      }),
    ];

    it("items are draggable", () => {
      const { container } = render(
        <QueueTab pendingQueue={queue} onReorderQueue={mockOnReorderQueue} />
      );

      const draggableItems = container.querySelectorAll("[draggable='true']");
      expect(draggableItems).toHaveLength(2);
    });

    it("calls onReorderQueue on drop when draggedItem exists", () => {
      const { container } = render(
        <QueueTab pendingQueue={queue} onReorderQueue={mockOnReorderQueue} />
      );

      const items = container.querySelectorAll("[draggable='true']");
      const firstItem = items[0];
      const secondItem = items[1];

      // Start drag on first item
      fireEvent.dragStart(firstItem, {
        dataTransfer: { effectAllowed: "move" },
      });

      // Drag over second item
      fireEvent.dragOver(secondItem, {
        dataTransfer: { dropEffect: "move" },
      });

      // Drop on second item
      fireEvent.drop(secondItem, {
        dataTransfer: {},
      });

      expect(mockOnReorderQueue).toHaveBeenCalledWith("q1", 1);
    });

    it("does not call onReorderQueue on drop when onReorderQueue is not provided", () => {
      const { container } = render(<QueueTab pendingQueue={queue} />);

      const items = container.querySelectorAll("[draggable='true']");
      const firstItem = items[0];
      const secondItem = items[1];

      fireEvent.dragStart(firstItem, {
        dataTransfer: { effectAllowed: "move" },
      });

      fireEvent.drop(secondItem, {
        dataTransfer: {},
      });

      // Should not throw
    });

    it("handles dragLeave by clearing dragOverIndex", () => {
      const { container } = render(
        <QueueTab pendingQueue={queue} onReorderQueue={mockOnReorderQueue} />
      );

      const items = container.querySelectorAll("[draggable='true']");
      const firstItem = items[0];

      fireEvent.dragOver(firstItem, {
        dataTransfer: { dropEffect: "move" },
      });

      // After dragOver, the item should have the purple border class
      expect(firstItem.className).toContain("border-purple-500");

      fireEvent.dragLeave(firstItem);

      // After dragLeave, the purple border should be gone
      expect(firstItem.className).not.toContain("border-purple-500");
    });
  });

  describe("header", () => {
    it("shows queue management header", () => {
      render(<QueueTab pendingQueue={[]} />);

      expect(screen.getByText("Queue Management")).toBeInTheDocument();
    });

    it("shows drag instruction text", () => {
      render(<QueueTab pendingQueue={[]} />);

      expect(
        screen.getByText("Drag songs to reorder • Click trash to remove")
      ).toBeInTheDocument();
    });
  });
});
