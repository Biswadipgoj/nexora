import type { WorkItemData } from '@/components/board/KanbanBoard';

/**
 * Shared work-item focus logic.
 *
 * Section 5.4 requires the list and board views of My Tasks to "preserve the
 * same filters and query state between them", and section 5.2 requires every
 * dashboard metric to be "clickable and preserve the filter that produced it".
 * Both are only true if one module owns the definitions of overdue, due today
 * and done — otherwise the strip and the list drift apart and the counts stop
 * agreeing with the rows they open.
 */

export type FocusFilter = 'all' | 'overdue' | 'due-today' | 'in-progress' | 'completed';

/** Buckets used for the default My Tasks ordering (section 5.4). */
export type FocusBucket = 'overdue' | 'due-today' | 'due-soon' | 'unscheduled' | 'completed';

const DUE_SOON_DAYS = 7;

export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isDone(item: WorkItemData): boolean {
  return Boolean(item.status_id?.toLowerCase().includes('done'));
}

export function isInProgress(item: WorkItemData): boolean {
  const status = item.status_id?.toLowerCase() ?? '';
  return !isDone(item) && (status.includes('progress') || status.includes('review'));
}

/** Parses a due date defensively — the field is nullable and free-form upstream. */
export function dueDateOf(item: WorkItemData): Date | null {
  if (!item.due_date) return null;
  const parsed = new Date(item.due_date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function bucketOf(item: WorkItemData, now: Date = new Date()): FocusBucket {
  if (isDone(item)) return 'completed';

  const due = dueDateOf(item);
  if (!due) return 'unscheduled';

  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);

  if (due < today) return 'overdue';
  if (due < tomorrow) return 'due-today';
  if (due < addDays(today, DUE_SOON_DAYS)) return 'due-soon';
  return 'unscheduled';
}

export function matchesFilter(
  item: WorkItemData,
  filter: FocusFilter,
  now: Date = new Date()
): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'completed':
      return isDone(item);
    case 'in-progress':
      return isInProgress(item);
    case 'overdue':
      return bucketOf(item, now) === 'overdue';
    case 'due-today':
      return bucketOf(item, now) === 'due-today';
  }
}

export function filterItems(
  items: WorkItemData[],
  filter: FocusFilter,
  now: Date = new Date()
): WorkItemData[] {
  return items.filter((item) => matchesFilter(item, filter, now));
}

/**
 * Section 5.4: "The default sort is overdue, due today, due soon, then
 * unscheduled." Completed work sinks to the bottom; ties break on the earlier
 * due date, then on higher priority, so the order is stable across renders.
 */
const BUCKET_RANK: Record<FocusBucket, number> = {
  overdue: 0,
  'due-today': 1,
  'due-soon': 2,
  unscheduled: 3,
  completed: 4,
};

export function sortForFocus(items: WorkItemData[], now: Date = new Date()): WorkItemData[] {
  return [...items].sort((a, b) => {
    const rank = BUCKET_RANK[bucketOf(a, now)] - BUCKET_RANK[bucketOf(b, now)];
    if (rank !== 0) return rank;

    const dueA = dueDateOf(a);
    const dueB = dueDateOf(b);
    if (dueA && dueB && dueA.getTime() !== dueB.getTime()) return dueA.getTime() - dueB.getTime();
    if (dueA && !dueB) return -1;
    if (!dueA && dueB) return 1;

    return (b.priority ?? 0) - (a.priority ?? 0);
  });
}

export interface FocusCounts {
  overdue: number;
  dueToday: number;
  inProgress: number;
  completed: number;
  open: number;
  total: number;
}

export function countFocus(items: WorkItemData[], now: Date = new Date()): FocusCounts {
  const counts: FocusCounts = {
    overdue: 0,
    dueToday: 0,
    inProgress: 0,
    completed: 0,
    open: 0,
    total: items.length,
  };

  for (const item of items) {
    if (isDone(item)) {
      counts.completed += 1;
      continue;
    }

    counts.open += 1;
    if (isInProgress(item)) counts.inProgress += 1;

    const bucket = bucketOf(item, now);
    if (bucket === 'overdue') counts.overdue += 1;
    else if (bucket === 'due-today') counts.dueToday += 1;
  }

  return counts;
}

/** Human label for a due date, used on cards and rows. */
export function formatDueLabel(item: WorkItemData, now: Date = new Date()): string | null {
  const due = dueDateOf(item);
  if (!due) return null;

  const today = startOfDay(now);
  const days = Math.round((startOfDay(due).getTime() - today.getTime()) / 86_400_000);

  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days === -1) return '1 day overdue';
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days < 7) return `Due in ${days} days`;

  return `Due ${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

export const FILTER_LABELS: Record<FocusFilter, string> = {
  all: 'All tasks',
  overdue: 'Overdue',
  'due-today': 'Due today',
  'in-progress': 'In progress',
  completed: 'Completed',
};
