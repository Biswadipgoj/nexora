import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isDemoRequest } from '@/lib/supabase/config';
import { workItemSchemas } from '@/lib/validation/workspace';
import { workItemQueries } from '@/lib/db/work-items';
import {
  UUID_REGEX,
  categoryForSlug,
  resolveStatusForItem,
  resolveTypeForItem,
} from '@/lib/db/reference-ids';
import { getDemoWorkItem, updateDemoWorkItem, softDeleteDemoWorkItem } from '@/lib/demo/demo-store';

/**
 * Single Work Item API — Get, Update, Soft Delete.
 * §3.2: Generic work item mutations.
 * §11.1: Soft deletes on user-facing content so undo is possible.
 * §12.4: RLS with check prevents cross-tenant re-parenting.
 */

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;

  if (isDemoRequest(request.cookies)) {
    const item = getDemoWorkItem(id);
    if (!item) return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    return NextResponse.json({ item: { ...item, status_category: categoryForSlug(item.status_id) } });
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!UUID_REGEX.test(id)) return NextResponse.json({ error: 'Work item not found' }, { status: 404 });

  try {
    const item = await workItemQueries.getById(supabase, id);
    if (!item) return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    return NextResponse.json({ item });
  } catch {
    // Not found and not permitted answer the same way (§10, permission leakage).
    return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;

  const json = await request.json().catch(() => null);
  const parsed = workItemSchemas.update.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid update.' }, { status: 400 });
  }
  const validated = parsed.data;

  if (isDemoRequest(request.cookies)) {
    const updated = updateDemoWorkItem(id, {
      ...validated,
      description: validated.description ?? undefined,
      comments: validated.comments ?? undefined,
    });
    if (!updated) return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    return NextResponse.json({ item: { ...updated, status_category: categoryForSlug(updated.status_id) } });
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!UUID_REGEX.test(id)) return NextResponse.json({ error: 'Work item not found' }, { status: 404 });

  /**
   * Build the column patch.
   *
   * 1. `assignees`, `assignee_ids` and `comments` are accepted by the schema
   *    but are NOT columns on `work_items`; passing them through made
   *    PostgREST reject the whole update.
   * 2. `status_id` and `type_id` arrive as built-in slugs whenever the board
   *    falls back to its defaults, but the columns are uuid FKs.
   * 3. The drawer sends `description` as plain text; storage expects a delta.
   */
  const { description, assignees, assignee_ids, comments, ...columns } = validated;

  const patch: Record<string, unknown> = { ...columns };

  if (description !== undefined) {
    patch.description =
      typeof description === 'string' ? { ops: [{ insert: `${description}\n` }] } : description;
  }

  if (patch.status_id && !UUID_REGEX.test(String(patch.status_id))) {
    patch.status_id = await resolveStatusForItem(supabase, id, String(patch.status_id));
  }

  if (patch.type_id && !UUID_REGEX.test(String(patch.type_id))) {
    patch.type_id = await resolveTypeForItem(supabase, id, String(patch.type_id));
  }

  // A slug that matched nothing must not be written into a uuid column.
  if (patch.status_id && !UUID_REGEX.test(String(patch.status_id))) delete patch.status_id;
  if (patch.type_id && !UUID_REGEX.test(String(patch.type_id))) delete patch.type_id;

  // Keep completed_at honest: set when work lands in a done column, cleared
  // when it leaves one.
  let statusCategory: string | null = null;
  if (patch.status_id) {
    const { data: status } = await supabase
      .from('statuses')
      .select('category')
      .eq('id', String(patch.status_id))
      .maybeSingle();
    statusCategory = status?.category ?? null;
    if (statusCategory) patch.completed_at = statusCategory === 'done' ? new Date().toISOString() : null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  let updated;
  try {
    updated = await workItemQueries.update(supabase, id, patch);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';
    const denied = /row-level security|permission|not authorized|violates/i.test(message);
    return NextResponse.json(
      { error: denied ? 'You do not have permission to change this task.' : 'Could not save that change.' },
      { status: denied ? 403 : 400 }
    );
  }

  // Best effort. An activity-log failure previously propagated and turned a
  // successful update into a 400.
  try {
    await supabase.from('activity_events').insert({
      workspace_id: updated.workspace_id,
      entity_type: 'work_item',
      entity_id: updated.id,
      actor_id: user.id,
      action: 'updated',
      changes: columns,
    });
  } catch {}

  return NextResponse.json({
    item: { ...updated, ...(statusCategory ? { status_category: statusCategory } : {}) },
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;

  if (isDemoRequest(request.cookies)) {
    if (!softDeleteDemoWorkItem(id)) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Work item deleted' });
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!UUID_REGEX.test(id)) return NextResponse.json({ error: 'Work item not found' }, { status: 404 });

  try {
    await workItemQueries.softDelete(supabase, id);
    return NextResponse.json({ success: true, message: 'Work item deleted' });
  } catch {
    return NextResponse.json({ error: 'Could not delete this task.' }, { status: 400 });
  }
}
