import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { workItemSchemas } from '@/lib/validation/workspace';
import { workItemQueries } from '@/lib/db/work-items';
import { logger } from '@/lib/logger';

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
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const validated = workItemSchemas.update.parse(json);

    const updated = await workItemQueries.update(supabase, id, validated);

    // Record activity event
    await supabase.from('activity_events').insert({
      workspace_id: updated.workspace_id,
      entity_type: 'work_item',
      entity_id: updated.id,
      actor_id: user.id,
      action: 'updated',
      changes: validated,
    });

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
