/**
 * The work item shape shared by the board, the dashboard views and the API
 * clients. Mirrors the columns the work-items routes return, plus the demo
 * store's display-only fields (assignees).
 */

export interface WorkItemAssignee {
  name: string;
  avatar?: string;
  role?: string;
}

export type StatusCategory = 'todo' | 'in_progress' | 'done';

export interface WorkItemData {
  id: string;
  sequence?: number;
  project_id?: string;
  workspace_id?: string;
  title: string;
  /** Plain text from the drawer, or a Quill-style delta from storage. */
  description?: unknown;
  priority?: number;
  status_id?: string;
  /**
   * The category of the item's status. Database statuses have UUID ids, so
   * "is this done?" cannot be answered from the id alone — the routes attach
   * the category whenever they know it.
   */
  status_category?: StatusCategory | string | null;
  type_id?: string;
  start_date?: string | null;
  due_date?: string | null;
  estimate?: number | null;
  assignees?: WorkItemAssignee[] | null;
  position?: number;
  created_at?: string;
  updated_at?: string;
}

export interface StatusColumn {
  id: string;
  name: string;
  category: StatusCategory | string;
  position: number;
  color?: string;
}

/** Extracts readable text from either description format. */
export function descriptionText(description: unknown): string {
  if (!description) return '';
  if (typeof description === 'string') return description;
  if (typeof description === 'object' && description !== null && 'ops' in description) {
    const ops = (description as { ops?: Array<{ insert?: unknown }> }).ops ?? [];
    return ops
      .map((op) => (typeof op.insert === 'string' ? op.insert : ''))
      .join('')
      .replace(/\n$/, '');
  }
  return '';
}

/** Tags each item with the category of its status, looked up by id. */
export function withStatusCategories<T extends { status_id?: string | null }>(
  items: T[],
  statuses: Array<{ id: string; category: string }>
): Array<T & { status_category?: string | null }> {
  const byId = new Map(statuses.map((s) => [s.id, s.category]));
  return items.map((item) => ({
    ...item,
    status_category: (item.status_id && byId.get(item.status_id)) || null,
  }));
}
