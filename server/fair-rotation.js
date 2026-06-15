/**
 * Fair round-robin queue insertion.
 *
 * Inserts a new song so the queue interleaves fairly between users.
 * The currently playing song (if any) counts as that user's first turn.
 * Only reorders among "pending" items — playing/completed items stay put.
 */
function getFairInsertionIndex(queue, addedByUserId) {
  const pending = [];
  for (let i = 0; i < queue.length; i++) {
    if (queue[i].status === "pending") {
      pending.push({ item: queue[i], idx: i });
    }
  }

  if (pending.length === 0) {
    return queue.length;
  }

  const playingSong = queue.find(item => item.status === "playing");
  const playingUserId = playingSong ? playingSong.addedByUserId : null;

  const userPendingCount = pending.filter(
    e => e.item.addedByUserId === addedByUserId
  ).length;

  if (userPendingCount === 0) {
    const insertPos = findSlotForNewUser(pending, playingUserId);
    if (insertPos >= pending.length) {
      return queue.length;
    }
    return pending[insertPos].idx;
  }

  const insertPos = findSlotForExistingUser(pending, addedByUserId);
  if (insertPos >= pending.length) {
    return queue.length;
  }
  return pending[insertPos].idx;
}

/**
 * For a user with no pending songs: find where round 1 ends.
 * The playing user already "used" their round-1 slot, so their first
 * pending song starts round 2. A new user's song belongs in round 1.
 */
function findSlotForNewUser(pending, playingUserId) {
  const seen = new Set();
  if (playingUserId) {
    seen.add(playingUserId);
  }

  for (let i = 0; i < pending.length; i++) {
    const uid = pending[i].item.addedByUserId;
    if (seen.has(uid)) {
      return i;
    }
    seen.add(uid);
  }
  return pending.length;
}

/**
 * For a user who already has pending songs: find their last pending song,
 * then skip past one song from each OTHER distinct user.
 */
function findSlotForExistingUser(pending, userId) {
  let lastOwnIdx = -1;
  for (let i = pending.length - 1; i >= 0; i--) {
    if (pending[i].item.addedByUserId === userId) {
      lastOwnIdx = i;
      break;
    }
  }

  if (lastOwnIdx === -1) {
    return pending.length;
  }

  const otherUsers = new Set();
  for (const entry of pending) {
    if (entry.item.addedByUserId !== userId) {
      otherUsers.add(entry.item.addedByUserId);
    }
  }

  let pos = lastOwnIdx + 1;
  const othersToSkip = otherUsers.size;
  let skipped = 0;

  while (pos < pending.length && skipped < othersToSkip) {
    if (pending[pos].item.addedByUserId !== userId) {
      skipped++;
    }
    pos++;
  }

  return pos;
}

module.exports = { getFairInsertionIndex };
