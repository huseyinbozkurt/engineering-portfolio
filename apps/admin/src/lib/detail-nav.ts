import type { SiblingLink } from "@/components/detail/prev-next-nav";

/**
 * Computes previous / next sibling links for a detail page from the same record
 * list the index page renders (so order matches). Returns `undefined` ends at the
 * list boundaries. The detail pages already fetch the full content index, so this
 * adds no extra query.
 */
export function siblingLinks<T extends { id: string }>(
  items: readonly T[],
  currentId: string,
  build: (item: T) => SiblingLink,
): { prev?: SiblingLink | undefined; next?: SiblingLink | undefined } {
  const index = items.findIndex((item) => item.id === currentId);
  if (index === -1) {
    return {};
  }
  const previous = index > 0 ? items[index - 1] : undefined;
  const next = index < items.length - 1 ? items[index + 1] : undefined;
  return {
    prev: previous ? build(previous) : undefined,
    next: next ? build(next) : undefined,
  };
}
