import { describe, it, expect } from "vitest";
import { getFairInsertionIndex } from "../../server/fair-rotation";

function makeQueueItem(
  addedByUserId: string,
  status: string = "pending",
  title: string = "Song"
) {
  return {
    id: `queue_${Math.random().toString(36).substr(2, 9)}`,
    mediaItem: { title, artist: "Artist" },
    addedBy: addedByUserId,
    addedByUserId,
    status,
  };
}

describe("getFairInsertionIndex", () => {
  it("returns end of queue when no pending items", () => {
    const queue = [makeQueueItem("alice", "playing")];
    expect(getFairInsertionIndex(queue, "bob")).toBe(1);
  });

  it("returns end of empty queue", () => {
    expect(getFairInsertionIndex([], "alice")).toBe(0);
  });

  it("places new user after first round of existing users", () => {
    const queue = [
      makeQueueItem("alice", "pending", "A1"),
      makeQueueItem("alice", "pending", "A2"),
      makeQueueItem("alice", "pending", "A3"),
    ];
    const idx = getFairInsertionIndex(queue, "bob");
    expect(idx).toBe(1);
  });

  it("interleaves two users' songs: A1 B1 A2 B2", () => {
    const queue = [makeQueueItem("alice", "pending", "A1")];

    // Bob adds - should go after A1
    let idx = getFairInsertionIndex(queue, "bob");
    expect(idx).toBe(1);
    queue.splice(idx, 0, makeQueueItem("bob", "pending", "B1"));

    // Alice adds another - should go after B1
    idx = getFairInsertionIndex(queue, "alice");
    expect(idx).toBe(2);
    queue.splice(idx, 0, makeQueueItem("alice", "pending", "A2"));

    // Bob adds another - should go after A2
    idx = getFairInsertionIndex(queue, "bob");
    expect(idx).toBe(3);

    // Result: A1, B1, A2, B2
  });

  it("new user goes before existing user's pending song when one is playing", () => {
    const queue = [
      makeQueueItem("alice", "playing", "A1"),
      makeQueueItem("alice", "pending", "A2"),
    ];

    const idx = getFairInsertionIndex(queue, "bob");
    // Alice's playing song counts as her round-1 slot.
    // Her pending song is round 2. Bob's round-1 slot goes before it.
    expect(idx).toBe(1);
  });

  it("handles three users fairly", () => {
    const queue: ReturnType<typeof makeQueueItem>[] = [];

    // Alice adds 2
    let idx = getFairInsertionIndex(queue, "alice");
    queue.splice(idx, 0, makeQueueItem("alice", "pending", "A1"));
    idx = getFairInsertionIndex(queue, "alice");
    queue.splice(idx, 0, makeQueueItem("alice", "pending", "A2"));

    // Bob adds 2
    idx = getFairInsertionIndex(queue, "bob");
    queue.splice(idx, 0, makeQueueItem("bob", "pending", "B1"));
    idx = getFairInsertionIndex(queue, "bob");
    queue.splice(idx, 0, makeQueueItem("bob", "pending", "B2"));

    // Charlie adds 2
    idx = getFairInsertionIndex(queue, "charlie");
    queue.splice(idx, 0, makeQueueItem("charlie", "pending", "C1"));
    idx = getFairInsertionIndex(queue, "charlie");
    queue.splice(idx, 0, makeQueueItem("charlie", "pending", "C2"));

    const order = queue.map(q => q.mediaItem.title);
    // First round should have one from each: A1, B1, C1
    expect(order[0]).toBe("A1");
    expect(order[1]).toBe("B1");
    expect(order[2]).toBe("C1");
    // Second round: A2, B2, C2
    expect(order[3]).toBe("A2");
    expect(order[4]).toBe("B2");
    expect(order[5]).toBe("C2");
  });

  it("bob's song not last when alice adds 3 and bob adds 1", () => {
    const queue: ReturnType<typeof makeQueueItem>[] = [];

    // Alice adds 3
    let idx = getFairInsertionIndex(queue, "alice");
    queue.splice(idx, 0, makeQueueItem("alice", "pending", "A1"));
    idx = getFairInsertionIndex(queue, "alice");
    queue.splice(idx, 0, makeQueueItem("alice", "pending", "A2"));
    idx = getFairInsertionIndex(queue, "alice");
    queue.splice(idx, 0, makeQueueItem("alice", "pending", "A3"));

    // Bob adds 1
    idx = getFairInsertionIndex(queue, "bob");
    queue.splice(idx, 0, makeQueueItem("bob", "pending", "B1"));

    const order = queue.map(q => q.mediaItem.title);
    // Bob should be second (after A1), not last
    expect(order[1]).toBe("B1");
    expect(order[order.length - 1]).not.toBe("B1");
  });

  it("second user's song placed before first user's second song", () => {
    const queue: ReturnType<typeof makeQueueItem>[] = [];

    // Alice adds 2
    let idx = getFairInsertionIndex(queue, "alice");
    queue.splice(idx, 0, makeQueueItem("alice", "pending", "A1"));
    idx = getFairInsertionIndex(queue, "alice");
    queue.splice(idx, 0, makeQueueItem("alice", "pending", "A2"));

    // Bob adds 1
    idx = getFairInsertionIndex(queue, "bob");
    queue.splice(idx, 0, makeQueueItem("bob", "pending", "B1"));

    const order = queue.map(q => q.mediaItem.title);
    expect(order).toEqual(["A1", "B1", "A2"]);
  });
});
