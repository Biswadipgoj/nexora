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

const DEFAULT_STATUSES = [
  // Must stay in step with KanbanBoard's DEFAULT_STATUSES. When these lists
  // disagreed the board rendered four columns, then the first load replaced
  // them with three and quietly moved every Code Review card elsewhere.
  { id: 'status-todo', name: 'To Do', category: 'todo', position: 0, color: '#9B8CFF' },
  { id: 'status-in-progress', name: 'In Progress', category: 'in_progress', position: 1, color: '#F1B86A' },
  { id: 'status-review', name: 'Code Review', category: 'in_progress', position: 2, color: '#46D7E8' },
  { id: 'status-done', name: 'Done', category: 'done', position: 3, color: '#57D39A' },
];

const DEFAULT_TYPES = [
  { id: 'type-task', name: 'Task', icon: 'check-square', color: '#3B82F6' },
  { id: 'type-bug', name: 'Bug', icon: 'alert-circle', color: '#EF4444' },
  { id: 'type-feature', name: 'Feature', icon: 'zap', color: '#8B5CF6' },
];

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
    return NextResponse.json({ items, statuses: DEFAULT_STATUSES, types: DEFAULT_TYPES });
  }

  try {
    const [itemsRes, { data: dbStatuses }, { data: dbTypes }] = await Promise.all([
      workItemQueries.listForBoard(supabase, projectId, {
        limit,
        statusId: statusId && UUID_REGEX.test(statusId) ? statusId : undefined,
      }).catch((err) => {
        console.warn('[WorkItemsRoute] listForBoard query notice:', err?.message);
        return [];
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

    const items = itemsRes ?? [];

    return NextResponse.json({
      items,
      statuses: dbStatuses && dbStatuses.length > 0 ? dbStatuses : DEFAULT_STATUSES,
      types: dbTypes && dbTypes.length > 0 ? dbTypes : DEFAULT_TYPES,
    });
  } catch (err: unknown) {
    console.warn('[WorkItemsRoute] Graceful fallback to default board state:', err);
    return NextResponse.json({
      items: [],
      statuses: DEFAULT_STATUSES,
      types: DEFAULT_TYPES,
    });
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

    // Resolve non-UUID status_id to real DB status UUID if possible
    if (!UUID_REGEX.test(finalStatusId)) {
      try {
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
      } catch {}
    }

    // Resolve non-UUID type_id to real DB work_item_types UUID if possible
    if (!UUID_REGEX.test(finalTypeId)) {
      try {
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
      } catch {}
    }

    try {
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

      // Record activity event best-effort
      try {
        await supabase.from('activity_events').insert({
          workspace_id: validated.workspace_id,
          entity_type: 'work_item',
          entity_id: workItem.id,
          actor_id: user.id,
          action: 'created',
          changes: { title: workItem.title, sequence: workItem.sequence },
        });
      } catch {}

      return NextResponse.json({ workItem }, { status: 201 });
    } catch (createErr: unknown) {
      /**
       * A failed write must never be reported as a success.
       *
       * This previously swallowed the error and returned 201 with a fabricated
       * row (`id: 'wi-' + Date.now()`, a random sequence). The client showed the
       * task on the board, but nothing was stored — and because an RLS denial
       * arrives here too, a permission failure was indistinguishable from a
       * save. Section 3.4: "A user must understand whether a change was saved,
       * queued, rejected, or still in progress." Section 10 requires an
       * unauthorized id to "return safe errors and reveal no data".
       */
      const message = createErr instanceof Error ? createErr.message : '';
      const denied = /row-level security|permission|not authorized|violates/i.test(message);

      logger.warn('Work item creation failed', {
        action: 'work_item_create',
        outcome: denied ? 'denied' : 'error',
        workspace_id: validated.workspace_id,
        project_id: validated.project_id,
      });

      return NextResponse.json(
        {
          error: denied
            ? 'You do not have access to create work in this project.'
            : 'Could not create the task. Try again.',
        },
        { status: denied ? 403 : 500 }
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
