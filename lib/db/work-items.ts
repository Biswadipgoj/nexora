/**
 * Work item database queries.
 * §11.4: No SELECT *, cursor pagination, EXPLAIN ANALYZE required.
 * §3.2: Work items support all specified fields.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database, WorkItem } from './types';
import { clampPageSize } from './index';

const WORK_ITEM_COLUMNS = `
  id, workspace_id, project_id, team_id, parent_id,
  type_id, status_id, sequence, title, description,
  priority, creator_id, start_date, due_date, estimate,
  position, sprint_id, completed_at, created_at, updated_at
` as const;

const WORK_ITEM_WITH_RELATIONS = `
  ${WORK_ITEM_COLUMNS},
  work_item_assignees(user_id, assigned_at),
  work_item_labels:work_item_labels(label_id)
` as const;

export const workItemQueries = {
  /**
   * List work items for a project board view.
   * §11.2: Uses idx_wi_board index (project_id, status_id, position).
   * §11.4: No N+1 — assignees and labels fetched in one round trip.
   */
  async listForBoard(
    supabase: SupabaseClient<Database>,
    projectId: string,
    options?: { limit?: number; statusId?: string }
  ) {
    const limit = clampPageSize(options?.limit);
    let query = supabase
      .from('work_items')
      .select(WORK_ITEM_WITH_RELATIONS)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('position', { ascending: true })
      .limit(limit);

    if (options?.statusId) {
      query = query.eq('status_id', options.statusId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  /**
   * List work items assigned to a user across workspaces.
   * Powers "My Tasks" and "My Day" — the hottest query in the product.
   * §11.2: Uses idx_wi_assignee_user index.
   */
  async listAssignedToUser(
    supabase: SupabaseClient<Database>,
    userId: string,
    options?: {
      limit?: number;
      cursor?: string;
      workspaceId?: string;
      dueBefore?: string;
      includeCompleted?: boolean;
    }
  ) {
    const limit = clampPageSize(options?.limit);

    // First get assigned work item IDs
    let assigneeQuery = supabase
      .from('work_item_assignees')
      .select('work_item_id')
      .eq('user_id', userId);

    if (options?.workspaceId) {
      assigneeQuery = assigneeQuery.eq('workspace_id', options.workspaceId);
    }

    const { data: assignedIds, error: idsError } = await assigneeQuery;
    if (idsError) throw idsError;
    if (!assignedIds || assignedIds.length === 0) return { items: [], nextCursor: undefined, hasMore: false };

    const ids = assignedIds.map(a => a.work_item_id);

    let query = supabase
      .from('work_items')
      .select(WORK_ITEM_COLUMNS)
      .in('id', ids)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(limit + 1);

    if (!options?.includeCompleted) {
      query = query.is('completed_at', null);
    }

    if (options?.dueBefore) {
      query = query.lte('due_date', options.dueBefore);
    }

    if (options?.cursor) {
      query = query.lt('updated_at', options.cursor);
    }

    const { data, error } = await query;
    if (error) throw error;

    const hasMore = data && data.length > limit;
    const items = hasMore ? data.slice(0, limit) : (data ?? []);
    const nextCursor = hasMore ? items[items.length - 1]?.updated_at : undefined;

    return { items: items as WorkItem[], nextCursor, hasMore: !!hasMore };
  },

  /**
   * Get a single work item by ID with all relations.
   */
  async getById(supabase: SupabaseClient<Database>, id: string) {
    const { data, error } = await supabase
      .from('work_items')
      .select(`
        ${WORK_ITEM_COLUMNS},
        work_item_assignees(user_id, assigned_at),
        work_item_labels:work_item_labels(label_id),
        work_item_watchers(user_id)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create a work item with sequence generation.
   * §47: Thread-safe sequence via next_work_item_sequence().
   */
  async create(
    supabase: SupabaseClient<Database>,
    data: {
      workspace_id: string;
      project_id: string;
      type_id: string;
      status_id: string;
      title: string;
      description?: Record<string, unknown> | null;
      priority?: number;
      creator_id: string;
      parent_id?: string;
      team_id?: string;
      start_date?: string;
      due_date?: string;
      estimate?: number;
      sprint_id?: string;
    }
  ) {
    // Get next sequence number
    const { data: seqResult, error: seqError } = await supabase
      .rpc('next_work_item_sequence', { p_project_id: data.project_id });

    if (seqError) throw seqError;

    const sequence = seqResult as number;

    // Calculate position (end of the list for the given status)
    const { data: lastItem } = await supabase
      .from('work_items')
      .select('position')
      .eq('project_id', data.project_id)
      .eq('status_id', data.status_id)
      .is('deleted_at', null)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const position = lastItem ? (lastItem.position as number) + 1 : 0;

    const { data: workItem, error } = await supabase
      .from('work_items')
      .insert({
        workspace_id: data.workspace_id,
        project_id: data.project_id,
        type_id: data.type_id,
        status_id: data.status_id,
        title: data.title,
        description: data.description ?? null,
        priority: data.priority ?? 0,
        creator_id: data.creator_id,
        sequence,
        position,
        parent_id: data.parent_id ?? null,
        team_id: data.team_id ?? null,
        start_date: data.start_date ?? null,
        due_date: data.due_date ?? null,
        estimate: data.estimate ?? null,
        sprint_id: data.sprint_id ?? null,
      })
      .select(WORK_ITEM_COLUMNS)
      .single();

    if (error) throw error;
    return workItem as WorkItem;
  },

  /**
   * Update a work item.
   * §12.4: RLS with check blocks cross-tenant re-parenting.
   */
  async update(
    supabase: SupabaseClient<Database>,
    id: string,
    data: Partial<{
      title: string;
      description: Record<string, unknown> | null;
      status_id: string;
      priority: number;
      type_id: string;
      start_date: string | null;
      due_date: string | null;
      estimate: number | null;
      position: number;
      sprint_id: string | null;
      parent_id: string | null;
      team_id: string | null;
      completed_at: string | null;
    }>
  ) {
    const { data: workItem, error } = await supabase
      .from('work_items')
      .update(data)
      .eq('id', id)
      .select(WORK_ITEM_COLUMNS)
      .single();

    if (error) throw error;
    return workItem as WorkItem;
  },

  /**
   * Soft delete a work item.
   * §11.1: Soft deletes so undo is possible.
   */
  async softDelete(supabase: SupabaseClient<Database>, id: string) {
    const { error } = await supabase
      .from('work_items')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },
};
