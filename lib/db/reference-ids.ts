import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Resolving built-in slugs to database ids.
 *
 * The board falls back to built-in statuses (`status-todo`, `status-review`,
 * `status-done`) and categories (`type-ui`, `type-bug`, …) whenever a project
 * has no rows of its own. Those slugs then travel to the API — but
 * `work_items.status_id` and `work_items.type_id` are uuid foreign keys.
 *
 * POST resolved them inline; PATCH did not, so on a real project every status
 * move and every category change was rejected with a 400 that no client
 * surfaced. The card moved column and snapped back on reload. This is that
 * resolution, shared by both routes so they cannot drift apart again.
 */

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* eslint-disable @typescript-eslint/no-explicit-any */
type Client = SupabaseClient<any, any, any>;

/**
 * Maps a status slug onto one of the project's own statuses.
 * Returns the input unchanged when nothing matches, so the caller can decide
 * whether to drop the field rather than write a bad value.
 */
export async function resolveStatusId(
  supabase: Client,
  projectId: string,
  slug: string
): Promise<string> {
  if (UUID_REGEX.test(slug)) return slug;

  try {
    const { data } = await supabase
      .from('statuses')
      .select('id, name, category')
      .eq('project_id', projectId)
      .order('position', { ascending: true });

    if (!data || data.length === 0) return slug;

    const needle = slug.toLowerCase();
    const match =
      data.find((s: { category?: string | null }) =>
        s.category ? needle.includes(String(s.category).toLowerCase()) : false
      ) ??
      data.find((s: { name?: string | null }) =>
        s.name ? needle.includes(String(s.name).toLowerCase().replace(/\s+/g, '-')) : false
      );

    return match?.id ?? slug;
  } catch {
    return slug;
  }
}

/** Maps a work-item type slug onto a row in `work_item_types`. */
export async function resolveTypeId(supabase: Client, slug: string): Promise<string> {
  if (UUID_REGEX.test(slug)) return slug;

  try {
    const { data } = await supabase.from('work_item_types').select('id, name').limit(50);
    if (!data || data.length === 0) return slug;

    const needle = slug.toLowerCase();
    const match = data.find((t: { name?: string | null }) =>
      t.name ? needle.includes(String(t.name).toLowerCase()) : false
    );

    return match?.id ?? slug;
  } catch {
    return slug;
  }
}

/**
 * Resolves a status slug for an existing work item, whose project is looked up
 * from the row itself — PATCH receives only the item id.
 */
export async function resolveStatusForItem(
  supabase: Client,
  workItemId: string,
  slug: string
): Promise<string> {
  if (UUID_REGEX.test(slug)) return slug;

  try {
    const { data } = await supabase
      .from('work_items')
      .select('project_id')
      .eq('id', workItemId)
      .single();

    if (!data?.project_id) return slug;
    return resolveStatusId(supabase, data.project_id, slug);
  } catch {
    return slug;
  }
}
