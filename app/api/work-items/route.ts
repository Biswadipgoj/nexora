import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { workItemSchemas } from '@/lib/validation/workspace';
import { workItemQueries } from '@/lib/db/work-items';
import { getDemoWorkItems, createDemoWorkItem } from '@/lib/demo/demo-store';
import { logger } from '@/lib/logger';

/**
 * Work Items API — List & Create.
 * §3.2: Generic work-item entity.
 * §11.4: No SELECT *, no unbounded queries.
 * §12: RLS authorization enforced server-side.
 */

export async function GET(request: NextRequest) {
  const isDemo = request.cookies.get('nexora_demo_session')?.value === 'true';
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !isDemo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('projectId');
  const statusId = searchParams.get('statusId') ?? undefined;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  if (isDemo) {
    const items = getDemoWorkItems(projectId, statusId);
    return NextResponse.json({ items });
  }

  try {
    const items = await workItemQueries.listForBoard(supabase, projectId, {
      limit,
      statusId,
    });

    return NextResponse.json({ items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch work items';
    logger.error('Failed to fetch work items', { error: message, user_id: user?.id });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const isDemo = request.cookies.get('nexora_demo_session')?.value === 'true';
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !isDemo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const validated = workItemSchemas.create.parse(json);

    if (isDemo) {
      const workItem = createDemoWorkItem({
        workspace_id: validated.workspace_id,
        project_id: validated.project_id,
        type_id: validated.type_id,
        status_id: validated.status_id,
        title: validated.title,
        priority: validated.priority,
        due_date: validated.due_date,
        assignees: validated.assignees,
      });
      return NextResponse.json({ workItem }, { status: 201 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workItem = await workItemQueries.create(supabase, {
      workspace_id: validated.workspace_id,
      project_id: validated.project_id,
      type_id: validated.type_id,
      status_id: validated.status_id,
      title: validated.title,
      description: validated.description,
      priority: validated.priority,
      creator_id: user.id,
      parent_id: validated.parent_id,
      team_id: validated.team_id,
      start_date: validated.start_date,
      due_date: validated.due_date,
      estimate: validated.estimate,
      sprint_id: validated.sprint_id,
    });

    // Record activity event (§11.2)
    await supabase.from('activity_events').insert({
      workspace_id: validated.workspace_id,
      entity_type: 'work_item',
      entity_id: workItem.id,
      actor_id: user.id,
      action: 'created',
      changes: { title: workItem.title, sequence: workItem.sequence },
    });

    logger.info('Created work item', {
      work_item_id: workItem.id,
      workspace_id: validated.workspace_id,
      project_id: validated.project_id,
      user_id: user.id,
    });

    return NextResponse.json({ workItem }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
