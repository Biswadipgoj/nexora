/**
 * Database query modules — one per entity, typed.
 * §11.4 query rules enforced here:
 * - No SELECT * — columns enumerated
 * - No unbounded queries — default limit 50, max 200
 * - Cursor/keyset pagination
 * - No N+1 — batch or join
 */

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

export function clampPageSize(size: number | undefined): number {
  const s = size ?? DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(1, s), MAX_PAGE_SIZE);
}
