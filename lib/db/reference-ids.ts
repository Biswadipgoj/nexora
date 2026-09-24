import type { SupabaseClient } from '@supabase/supabase-js';
import { getCategoryByIdOrName } from '@/lib/constants/categories';

/**
 * Resolving built-in slugs to database ids.
 *
 * The board falls back to built-in statuses (`status-todo`, `status-review`,
 * `status-done`) and categories (`type-ui`, `type-bug`, …) whenever a project
 * has no rows of its own. Those slugs then travel to the API — but
 * `work_items.status_id` and `work_items.type_id` are uuid foreign keys.
 *
 * Shared by POST and PATCH so the two routes cannot drift apart again.
 */

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* eslint-disable @typescript-eslint/no-explicit-any */
type Client = SupabaseClient<any, any, any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Which status category each built-in column slug stands for. */
const SLUG_CATEGORY: Record<string, string> = {
  'status-todo': 'todo',
  'status-in-progress': 'in_progress',
  'status-review': 'in_progress',
  'status-done': 'done',
};

/** The category of a built-in status slug, or null for anything else. */
export function categoryForSlug(slug: string | null | undefined): string | null {
  return (slug && SLUG_CATEGORY[slug]) || null;
}

const normalize = (value: string) => value.toLowerCase().replace(/[\s_]+/g, '-');

/**
 * Maps a status slug onto one of the project's own statuses. Returns the input
 * unchanged when nothing matches, so the caller can decide whether to drop the
 * field or pick a default rather than write a bad value.
 */
export async function resolveStatusId(supabase: Client, projectId: string, slug: string): Promise<string> {
  if (UUID_REGEX.test(slug)) return slug;

  try {
    const { data } = await supabase
      .from('statuses')
      .select('id, name, category, position')
      .eq('project_id', projectId)
      .order('position', { ascending: true });

    const statuses = (data ?? []) as Array<{ id: string; name: string | null; category: string | null }>;
    if (statuses.length === 0) return slug;

    const needle = normalize(slug);
    const byName = statuses.find((s) => s.name && needle.endsWith(normalize(s.name)));
    if (byName) return byName.id;

    const category = SLUG_CATEGORY[slug] ?? statuses.find((s) => s.category && needle.includes(normalize(s.category)))?.category;
    if (!category) return slug;

    const inCategory = statuses.filter((s) => s.category === category);
    // "Code Review" is the second in-progress column on the built-in board.
    const match = slug === 'status-review' && inCategory.length > 1 ? inCategory[1] : inCategory[0];
    return match?.id ?? slug;
  } catch {
    return slug;
  }
}

/**
 * Maps a category slug onto a row in `work_item_types` for the workspace.
 *
 * With `createMissing`, a category the workspace has no type for yet is added,
 * so choosing "Security" on a real project stays "Security" instead of
 * collapsing to the workspace's first type.
 */
export async function resolveTypeId(
  supabase: Client,
  slug: string,
  options: { workspaceId?: string; createMissing?: boolean } = {}
): Promise<string> {
  if (UUID_REGEX.test(slug)) return slug;

  try {
    let query = supabase.from('work_item_types').select('id, name').limit(100);
    if (options.workspaceId) query = query.eq('workspace_id', options.workspaceId);
    const { data } = await query;

    const types = (data ?? []) as Array<{ id: string; name: string | null }>;
    const category = getCategoryByIdOrName(slug);

    const match = types.find((t) => t.name && getCategoryByIdOrName(t.name).id === category.id);
    if (match) return match.id;

    if (options.createMissing && options.workspaceId) {
      const { data: created } = await supabase
        .from('work_item_types')
        .insert({ workspace_id: options.workspaceId, name: category.name, color: category.color })
        .select('id')
        .single();
      if (created?.id) return created.id as string;
    }

    return slug;
  } catch {
    return slug;
  }
}

/** Looks up the project and workspace an existing item belongs to. */
async function itemScope(supabase: Client, workItemId: string) {
  const { data } = await supabase
    .from('work_items')
    .select('project_id, workspace_id')
    .eq('id', workItemId)
    .single();
  return (data ?? null) as { project_id: string; workspace_id: string } | null;
}

/** Resolves a status slug for an existing work item (PATCH receives only the id). */
export async function resolveStatusForItem(supabase: Client, workItemId: string, slug: string): Promise<string> {
  if (UUID_REGEX.test(slug)) return slug;
  try {
    const scope = await itemScope(supabase, workItemId);
    return scope ? resolveStatusId(supabase, scope.project_id, slug) : slug;
  } catch {
    return slug;
  }
}

/** Resolves a category slug for an existing work item, within its own workspace. */
export async function resolveTypeForItem(supabase: Client, workItemId: string, slug: string): Promise<string> {
  if (UUID_REGEX.test(slug)) return slug;
  try {
    const scope = await itemScope(supabase, workItemId);
    return scope
      ? resolveTypeId(supabase, slug, { workspaceId: scope.workspace_id, createMissing: true })
      : slug;
  } catch {
    return slug;
  }
}
