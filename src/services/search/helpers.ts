/**
 * Builds an error message based on which search endpoints failed.
 * Returns undefined if all searches succeeded.
 */
export function buildSearchErrorMessage(
  artistSuccess: boolean,
  albumSuccess: boolean,
  songSuccess: boolean
): string | undefined {
  const failed: string[] = [];
  if (!artistSuccess) failed.push("artists");
  if (!albumSuccess) failed.push("albums");
  if (!songSuccess) failed.push("songs");

  if (failed.length === 0) return undefined;
  if (failed.length === 1) return `Failed to search ${failed[0]}`;
  if (failed.length === 2)
    return `Failed to search ${failed[0]} and ${failed[1]}`;
  return `Failed to search ${failed.slice(0, -1).join(", ")}, and ${failed[failed.length - 1]}`;
}

/**
 * Utility function to merge results without duplicates
 */
export function mergeUniqueResults<T extends { id: string }>(
  existing: T[],
  newResults: T[]
): T[] {
  const combined = [...existing, ...newResults];
  const unique = combined.filter(
    (item, index, arr) => arr.findIndex(i => i.id === item.id) === index
  );

  console.log(
    `Merged results: ${existing.length} + ${newResults.length} = ${combined.length} total, ${unique.length} unique (${combined.length - unique.length} duplicates removed)`
  );

  return unique;
}
