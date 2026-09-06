import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { workItemSchemas } from '@/lib/validation/workspace';
import { workItemQueries } from '@/lib/db/work-items';
import { UUID_REGEX, resolveStatusForItem, resolveTypeId } from '@/lib/db/reference-ids';
import {
  getDemoWorkItem,
  updateDemoWorkItem,
  softDeleteDemoWorkItem,
} from '@/lib/demo/demo-store';

/**
 * Single Work Item API — Get, Update, Soft Delete.
 * §3.2: Generic work item mutations.
 * §11.1: Soft deletes on user-facing content so undo is possible.
 * §12.4: RLS with check prevents cross-tenant re-parenting.
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isDemo = request.cookies.get('nexora_demo_session')?.value === 'true';

  if (isDemo) {
    const item = getDemoWorkItem(id);
    if (!item) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    }
    return NextResponse.json({ item });
  }

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const item = await workItemQueries.getById(supabase, id);
    if (!item) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching work item';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isDemo = request.cookies.get('nexora_demo_session')?.value === 'true';

  try {
    const json = await request.json();
    const validated = workItemSchemas.update.parse(json);

    if (isDemo) {
      const updated = updateDemoWorkItem(id, validated);
      if (!updated) {
        return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
      }
      return NextResponse.json({ item: updated });
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    /**
     * Build the column patch.
     *
     * Three things had to be fixed here, each of which turned a legitimate edit
     * into a silent 400 (section 3.4 — the user must know whether a change was
     * saved or rejected):
     *
     * 1. `assignees`, `assignee_ids` and `comments` are accepted by the schema
     *    but are NOT columns on `work_items`. Passing them straight through
     *    made PostgREST reject the whole update.
     * 2. `status_id` and `type_id` arrive as built-in slugs whenever the board
     *    falls back to its defaults, but the columns are uuid FKs. POST already
     *    resolved slugs to real ids; PATCH did not, so every status move on a
     *    real project failed.
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
      patch.type_id = await resolveTypeId(supabase, String(patch.type_id));
    }

    // A slug that matched nothing must not be written into a uuid column.
    if (patch.status_id && !UUID_REGEX.test(String(patch.status_id))) delete patch.status_id;
    if (patch.type_id && !UUID_REGEX.test(String(patch.type_id))) delete patch.type_id;

    const updated = await workItemQueries.update(supabase, id, patch);

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

    return NextResponse.json({ item: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update work item';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isDemo = request.cookies.get('nexora_demo_session')?.value === 'true';

  if (isDemo) {
    softDeleteDemoWorkItem(id);
    return NextResponse.json({
      success: true,
      message: 'Work item deleted (soft delete, undo available)',
      undoAvailableUntil: new Date(Date.now() + 10000).toISOString(),
    });
  }

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await workItemQueries.softDelete(supabase, id);
    return NextResponse.json({ success: true, message: 'Work item deleted (soft delete, undo available)' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete work item';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
