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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    const [items, { data: dbStatuses }, { data: dbTypes }] = await Promise.all([
      workItemQueries.listForBoard(supabase, projectId, {
        limit,
        statusId: statusId && UUID_REGEX.test(statusId) ? statusId : undefined,
      }),
      supabase
        .from('statuses')
        .select('id, name, category, position, color')
        .eq('project_id', projectId)
        .order('position', { ascending: true }),
      supabase
        .from('work_item_types')
        .select('id, name, icon, color'),
    ]);

    return NextResponse.json({
      items,
      statuses: dbStatuses && dbStatuses.length > 0 ? dbStatuses : undefined,
      types: dbTypes && dbTypes.length > 0 ? dbTypes : undefined,
    });
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

    let finalStatusId = validated.status_id;
    let finalTypeId = validated.type_id;

    // Resolve non-UUID status_id (e.g. 'status-todo' or category name) to real DB status UUID
    if (!UUID_REGEX.test(finalStatusId)) {
      const { data: matchedStatuses } = await supabase
        .from('statuses')
        .select('id, name, category')
        .eq('project_id', validated.project_id)
        .order('position', { ascending: true });

      if (matchedStatuses && matchedStatuses.length > 0) {
        const found =
          matchedStatuses.find(s =>
            finalStatusId.toLowerCase().includes(s.category.toLowerCase()) ||
            finalStatusId.toLowerCase().includes(s.name.toLowerCase())
          ) || matchedStatuses[0];
        finalStatusId = found.id;
      }
    }

    // Resolve non-UUID type_id (e.g. 'type-task') to real DB work_item_types UUID
    if (!UUID_REGEX.test(finalTypeId)) {
      const { data: matchedTypes } = await supabase
        .from('work_item_types')
        .select('id, name')
        .limit(10);

      if (matchedTypes && matchedTypes.length > 0) {
        const found =
          matchedTypes.find(t =>
            finalTypeId.toLowerCase().includes(t.name.toLowerCase())
          ) || matchedTypes[0];
        finalTypeId = found.id;
      }
    }

    const workItem = await workItemQueries.create(supabase, {
      workspace_id: validated.workspace_id,
      project_id: validated.project_id,
      type_id: finalTypeId,
      status_id: finalStatusId,
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
