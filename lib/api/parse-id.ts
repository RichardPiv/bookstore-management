/** Convert a URL segment (`"42"`) to a positive integer id, or `null` if invalid. */
export function parsePositiveIntId(rawId: string): number | null {
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}
