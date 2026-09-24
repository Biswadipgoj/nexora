import { getCategoryByIdOrName, type TaskCategory } from '@/lib/constants/categories';

/** Priority labels, 0 (none) to 4 (urgent). */
export const PRIORITY_LABELS: Record<number, string> = {
  0: 'No priority',
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Urgent',
};

export const PRIORITY_OPTIONS = [4, 3, 2, 1, 0] as const;

export function priorityLabel(priority: number | undefined | null): string {
  return PRIORITY_LABELS[priority ?? 0] ?? PRIORITY_LABELS[0];
}

/** The visual tone of a status column, from its category. */
export type StatusTone = 'todo' | 'progress' | 'review' | 'done';

export function statusTone(status: { id?: string; name?: string; category?: string | null }): StatusTone {
  const name = (status.name ?? '').toLowerCase();
  if (status.category === 'done') return 'done';
  if (name.includes('review') || status.id === 'status-review') return 'review';
  if (status.category === 'in_progress') return 'progress';
  return 'todo';
}

/**
 * Category of a work item. Database types have UUID ids, so the name is looked
 * up first — resolving the raw id always fell through to "General Task", and
 * every task on a real project showed the same category.
 */
export function categoryOf(
  typeId: string | undefined,
  types: Array<{ id: string; name: string }> = []
): TaskCategory {
  const typeName = typeId ? types.find((t) => t.id === typeId)?.name : undefined;
  return getCategoryByIdOrName(typeName ?? typeId);
}

/**
 * Swatch colours for categories: muted pigments, not the saturated brand hues
 * in lib/constants/categories, so a board full of categories stays calm.
 */
const CATEGORY_SWATCH: Record<string, string> = {
  'type-ui': '#7A6AA8',
  'type-security': '#B5523F',
  'type-feature': '#4A6FA5',
  'type-bug': '#C0763A',
  'type-backend': '#3E7F8C',
  'type-infra': '#4F7D5C',
  'type-docs': '#A88A3D',
  'type-task': '#8A8D85',
};

export function categorySwatch(categoryId: string): string {
  return CATEGORY_SWATCH[categoryId] ?? CATEGORY_SWATCH['type-task'];
}

export function initials(name: string | undefined | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

export function itemKey(projectKey: string, sequence: number | undefined): string {
  return sequence ? `${projectKey}-${sequence}` : `${projectKey}-…`;
}
