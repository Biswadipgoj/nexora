import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isDemoRequest } from '@/lib/supabase/config';
import { workItemSchemas } from '@/lib/validation/workspace';
import { workItemQueries } from '@/lib/db/work-items';
import { UUID_REGEX, resolveStatusId, resolveTypeId } from '@/lib/db/reference-ids';
import { getDemoWorkItems, createDemoWorkItem } from '@/lib/demo/demo-store';
import { withStatusCategories } from '@/lib/work/types';
import { logger } from '@/lib/logger';

/**
 * Work Items API — List & Create.
 * §3.2: Generic work-item entity.
 * §11.4: No SELECT *, no unbounded queries.
 * §12: RLS authorization enforced server-side.
 */

const DEFAULT_STATUSES = [
  // Must stay in step with KanbanBoard's DEFAULT_STATUSES. When these lists
  // disagreed the board rendered four columns, then the first load replaced
  // them with three and quietly moved every Code Review card elsewhere.
  { id: 'status-todo', name: 'To Do', category: 'todo', position: 0, color: '#8A8D85' },
  { id: 'status-in-progress', name: 'In Progress', category: 'in_progress', position: 1, color: '#B7791F' },
  { id: 'status-review', name: 'Code Review', category: 'in_progress', position: 2, color: '#4A5F9A' },
  { id: 'status-done', name: 'Done', category: 'done', position: 3, color: '#2F7D55' },
];

const DEFAULT_TYPES = [
  { id: 'type-task', name: 'Task', icon: 'check-square', color: '#3B82F6' },
  { id: 'type-bug', name: 'Bug', icon: 'alert-circle', color: '#EF4444' },
  { id: 'type-feature', name: 'Feature', icon: 'zap', color: '#8B5CF6' },
];

function parseLimit(raw: string | null): number {
  const value = raw ? Number.parseInt(raw, 10) : 50;
  return Number.isFinite(value) ? Math.min(Math.max(value, 1), 200) : 50;
}

export async function GET(request: NextRequest) {
  const isDemo = isDemoRequest(request.cookies);
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('projectId');
  const statusId = searchParams.get('statusId') ?? undefined;

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  if (isDemo) {
    const items = withStatusCategories(getDemoWorkItems(projectId, statusId), DEFAULT_STATUSES);
    return NextResponse.json({ items, statuses: DEFAULT_STATUSES, types: DEFAULT_TYPES });
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!UUID_REGEX.test(projectId)) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  try {
    const [items, statusesRes, typesRes] = await Promise.all([
      workItemQueries.listForBoard(supabase, projectId, {
        limit: parseLimit(searchParams.get('limit')),
        statusId: statusId && UUID_REGEX.test(statusId) ? statusId : undefined,
      }),
      supabase
        .from('statuses')
        .select('id, name, category, position, color')
        .eq('project_id', projectId)
        .order('position', { ascending: true }),
      supabase.from('work_item_types').select('id, name, icon, color'),
    ]);

    const statuses = statusesRes.data && statusesRes.data.length > 0 ? statusesRes.data : DEFAULT_STATUSES;

    return NextResponse.json({
      items: withStatusCategories(items, statuses),
      statuses,
      types: typesRes.data && typesRes.data.length > 0 ? typesRes.data : DEFAULT_TYPES,
    });
  } catch (err: unknown) {
    // A failed load is an error, not an empty board.
    logger.warn('Work items load failed', {
      project_id: projectId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Could not load this board.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const isDemo = isDemoRequest(request.cookies);

  const json = await request.json().catch(() => null);
  const parsed = workItemSchemas.create.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path.join('.');
    return NextResponse.json(
      { error: issue ? `${field ? `${field}: ` : ''}${issue.message}` : 'Invalid request payload' },
      { status: 400 }
    );
  }
  const validated = parsed.data;

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
    const [annotated] = withStatusCategories([workItem], DEFAULT_STATUSES);
    return NextResponse.json({ workItem: annotated }, { status: 201 });
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Built-in slugs become the project's own rows; an unmatched status falls
  // back to the first column rather than writing a slug into a uuid column.
  let statusIdToWrite = await resolveStatusId(supabase, validated.project_id, validated.status_id);
  if (!UUID_REGEX.test(statusIdToWrite)) {
    const { data: first } = await supabase
      .from('statuses')
      .select('id')
      .eq('project_id', validated.project_id)
      .order('position', { ascending: true })
      .limit(1)
      .maybeSingle();
    statusIdToWrite = first?.id ?? statusIdToWrite;
  }

  let typeIdToWrite = await resolveTypeId(supabase, validated.type_id, {
    workspaceId: validated.workspace_id,
    createMissing: true,
  });
  if (!UUID_REGEX.test(typeIdToWrite)) {
    const { data: firstType } = await supabase
      .from('work_item_types')
      .select('id')
      .eq('workspace_id', validated.workspace_id)
      .limit(1)
      .maybeSingle();
    typeIdToWrite = firstType?.id ?? typeIdToWrite;
  }

  try {
    const workItem = await workItemQueries.create(supabase, {
      workspace_id: validated.workspace_id,
      project_id: validated.project_id,
      type_id: typeIdToWrite,
      status_id: statusIdToWrite,
      title: validated.title,
      description: validated.description ?? null,
      priority: validated.priority,
      creator_id: user.id,
      parent_id: validated.parent_id ?? undefined,
      team_id: validated.team_id ?? undefined,
      start_date: validated.start_date ?? undefined,
      due_date: validated.due_date ?? undefined,
      estimate: validated.estimate ?? undefined,
      sprint_id: validated.sprint_id ?? undefined,
    });

    // Best effort: a failed activity log must not fail the create.
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

    const { data: status } = await supabase
      .from('statuses')
      .select('id, category')
      .eq('id', workItem.status_id)
      .maybeSingle();
    const [annotated] = withStatusCategories([workItem], status ? [status] : []);

    return NextResponse.json({ workItem: annotated }, { status: 201 });
  } catch (createErr: unknown) {
    /**
     * A failed write must never be reported as a success. This previously
     * returned 201 with a fabricated row, so an RLS denial looked like a save.
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
}
