/**
 * Workspace database queries.
 * §11.4: No SELECT *, no unbounded queries, cursor pagination.
 * §12: All queries go through RLS — workspace_id enforced at DB level.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Workspace, WorkspaceMember, WorkspaceRole } from './types';
import { clampPageSize } from './index';

const WORKSPACE_COLUMNS = 'id, name, slug, is_personal, owner_id, plan, settings, created_at, updated_at' as const;
const MEMBER_COLUMNS = 'id, workspace_id, user_id, role, invited_by, joined_at' as const;

export const workspaceQueries = {
  /**
   * Get all workspaces the current user is a member of.
   * RLS enforces visibility — no additional filtering needed.
   */
  async list(
    supabase: SupabaseClient<Database>,
    options?: { limit?: number; cursor?: string }
  ) {
    const limit = clampPageSize(options?.limit);
    let query = supabase
      .from('workspaces')
      .select(WORKSPACE_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(limit + 1); // +1 to detect if there's a next page

    if (options?.cursor) {
      query = query.lt('created_at', options.cursor);
    }

    const { data, error } = await query;
    if (error) throw error;

    const hasMore = data && data.length > limit;
    const items = hasMore ? data.slice(0, limit) : (data ?? []);
    const nextCursor = hasMore ? items[items.length - 1]?.created_at : undefined;

    return { items, nextCursor, hasMore: !!hasMore };
  },

  /**
   * Get a single workspace by ID.
   */
  async getById(supabase: SupabaseClient<Database>, id: string) {
    const { data, error } = await supabase
      .from('workspaces')
      .select(WORKSPACE_COLUMNS)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Workspace;
  },

  /**
   * Get a workspace by slug.
   */
  async getBySlug(supabase: SupabaseClient<Database>, slug: string) {
    const { data, error } = await supabase
      .from('workspaces')
      .select(WORKSPACE_COLUMNS)
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data as Workspace;
  },

  /**
   * Create a workspace and add the creator as owner.
   * §10.2: Personal workspaces are created automatically on signup.
   */
  async create(
    supabase: SupabaseClient<Database>,
    data: { name: string; slug: string; is_personal?: boolean },
    userId: string
  ) {
    // Create workspace
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({
        name: data.name,
        slug: data.slug,
        is_personal: data.is_personal ?? false,
        owner_id: userId,
        plan: 'free',
        settings: {},
      })
      .select(WORKSPACE_COLUMNS)
      .single();

    if (wsError) throw wsError;

    // Add creator as owner member
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: userId,
        role: 'owner' as WorkspaceRole,
      });

    if (memberError) throw memberError;

    return workspace as Workspace;
  },

  /**
   * Update a workspace.
   */
  async update(
    supabase: SupabaseClient<Database>,
    id: string,
    data: { name?: string; settings?: Record<string, unknown> }
  ) {
    const { data: workspace, error } = await supabase
      .from('workspaces')
      .update(data)
      .eq('id', id)
      .select(WORKSPACE_COLUMNS)
      .single();

    if (error) throw error;
    return workspace as Workspace;
  },

  /**
   * Soft delete a workspace.
   * §11.1: Soft deletes on user-facing content.
   */
  async softDelete(supabase: SupabaseClient<Database>, id: string) {
    const { error } = await supabase
      .from('workspaces')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },
};

export const memberQueries = {
  /**
   * List members of a workspace.
   */
  async list(
    supabase: SupabaseClient<Database>,
    workspaceId: string,
    options?: { limit?: number }
  ) {
    const limit = clampPageSize(options?.limit);
    const { data, error } = await supabase
      .from('workspace_members')
      .select(MEMBER_COLUMNS)
      .eq('workspace_id', workspaceId)
      .order('joined_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data as WorkspaceMember[];
  },

  /**
   * Get current user's role in a workspace.
   * §12.3: Role resolution — never trust client-supplied role.
   */
  async getCurrentUserRole(
    supabase: SupabaseClient<Database>,
    workspaceId: string
  ): Promise<WorkspaceRole | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (error) return null;
    return data?.role as WorkspaceRole ?? null;
  },

  /**
   * Invite a member to a workspace.
   */
  async add(
    supabase: SupabaseClient<Database>,
    workspaceId: string,
    userId: string,
    role: WorkspaceRole = 'member'
  ) {
    const { data, error } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        role,
      })
      .select(MEMBER_COLUMNS)
      .single();

    if (error) throw error;
    return data as WorkspaceMember;
  },

  /**
   * Remove a member from a workspace.
   */
  async remove(
    supabase: SupabaseClient<Database>,
    workspaceId: string,
    userId: string
  ) {
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);

    if (error) throw error;
  },
};
