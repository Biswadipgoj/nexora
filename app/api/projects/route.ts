import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { isDemoRequest } from '@/lib/supabase/config';
import { projectSchemas } from '@/lib/validation/workspace';
import { getDemoProjects, addDemoProject } from '@/lib/demo/demo-store';
import { logger } from '@/lib/logger';

/**
 * Projects API.
 * §11.4: No SELECT *, proper pagination, server-side validation.
 * §12: Database RLS enforces authorization.
 *
 * Demo and live data never mix. Live requests used to merge the process-wide
 * demo list into their results and copy every newly created project into it,
 * so the sample "Mobile App" project appeared in real workspaces and a project
 * created by one user was listed for every other user on the same server. A
 * failed insert also fell back to a fake in-memory project that the board
 * could not open.
 */

const PROJECT_COLUMNS =
  'id, workspace_id, team_id, name, key, description, mode, is_personal, item_counter, created_at, updated_at';

const DEFAULT_STATUSES = [
  { name: 'To Do', category: 'todo', position: 0, color: '#8A8D85' },
  { name: 'In Progress', category: 'in_progress', position: 1, color: '#B7791F' },
  { name: 'Done', category: 'done', position: 2, color: '#2F7D55' },
] as const;

function validationMessage(err: ZodError): string {
  const issue = err.issues[0];
  if (!issue) return 'Invalid request payload';
  const field = issue.path.join('.');
  return field ? `${field}: ${issue.message}` : issue.message;
}

export async function GET(request: NextRequest) {
  if (isDemoRequest(request.cookies)) {
    return NextResponse.json({ projects: getDemoProjects() });
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workspaceId = request.nextUrl.searchParams.get('workspaceId');

  let query = supabase
    .from('projects')
    .select(PROJECT_COLUMNS)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(200);

  if (workspaceId) query = query.eq('workspace_id', workspaceId);

  const { data, error } = await query;

  if (error) {
    logger.warn('Failed to fetch projects', { error: error.message, user_id: user.id });
    return NextResponse.json({ error: 'Could not load projects.' }, { status: 500 });
  }

  return NextResponse.json({ projects: data ?? [] });
}

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = projectSchemas.create.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: validationMessage(parsed.error) }, { status: 400 });
  }

  const validated = parsed.data;

  if (isDemoRequest(request.cookies)) {
    const duplicate = getDemoProjects().some((p) => p.key === validated.key);
    if (duplicate) {
      return NextResponse.json(
        { error: `A project with the key ${validated.key} already exists.` },
        { status: 409 }
      );
    }
    const project = addDemoProject(validated);
    return NextResponse.json({ project }, { status: 201 });
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: project, error: projError } = await supabase
    .from('projects')
    .insert({
      workspace_id: validated.workspace_id,
      team_id: validated.team_id ?? null,
      name: validated.name,
      key: validated.key,
      description: validated.description ?? null,
      mode: validated.mode,
      is_personal: validated.is_personal,
      created_by: user.id,
    })
    .select(PROJECT_COLUMNS)
    .single();

  if (projError || !project) {
    const message = projError?.message ?? '';
    const duplicate = projError?.code === '23505' || /duplicate key/i.test(message);
    const denied = /row-level security|permission/i.test(message);

    logger.warn('Project creation failed', {
      action: 'project_create',
      outcome: denied ? 'denied' : 'error',
      workspace_id: validated.workspace_id,
    });

    if (duplicate) {
      return NextResponse.json(
        { error: `A project with the key ${validated.key} already exists in this workspace.` },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: denied ? 'You do not have permission to create projects here.' : 'Could not create the project.' },
      { status: denied ? 403 : 500 }
    );
  }

  // The creator manages the project, and the board needs its three columns.
  const { error: memberError } = await supabase.from('project_members').insert({
    project_id: project.id,
    user_id: user.id,
    workspace_id: validated.workspace_id,
    role: 'manager',
  });
  if (memberError) logger.warn('Project membership insert failed', { error: memberError.message });

  const { error: statusError } = await supabase.from('statuses').insert(
    DEFAULT_STATUSES.map((st) => ({
      workspace_id: validated.workspace_id,
      project_id: project.id,
      name: st.name,
      category: st.category,
      position: st.position,
      color: st.color,
    }))
  );
  if (statusError) logger.warn('Default statuses insert failed', { error: statusError.message });

  logger.info('Created project', { project_id: project.id, key: project.key, user_id: user.id });

  return NextResponse.json({ project }, { status: 201 });
}
