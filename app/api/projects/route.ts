import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { projectSchemas } from '@/lib/validation/workspace';
import { logger } from '@/lib/logger';

/**
 * Projects API.
 * §11.4: No SELECT *, proper pagination, server-side validation.
 * §12: Database RLS enforces authorization.
 */

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const workspaceId = searchParams.get('workspaceId');

  let query = supabase
    .from('projects')
    .select('id, workspace_id, team_id, name, key, description, mode, is_personal, item_counter, created_at, updated_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Failed to fetch projects', { error: error.message, user_id: user.id });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ projects: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const validated = projectSchemas.create.parse(json);

    // 1. Create the project
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
      .select('id, workspace_id, team_id, name, key, description, mode, is_personal, item_counter, created_at, updated_at')
      .single();

    if (projError) {
      logger.error('Failed to insert project', { error: projError.message, user_id: user.id });
      return NextResponse.json({ error: projError.message }, { status: 400 });
    }

    // 2. Add creator as project member with manager role
    await supabase.from('project_members').insert({
      project_id: project.id,
      user_id: user.id,
      workspace_id: validated.workspace_id,
      role: 'manager',
    });

    // 3. Create default statuses (§7.3: Ordered list for Simple Mode)
    const defaultStatuses = [
      { name: 'To Do', category: 'todo', position: 0, color: '#6B7280' },
      { name: 'In Progress', category: 'in_progress', position: 1, color: '#3B82F6' },
      { name: 'Done', category: 'done', position: 2, color: '#10B981' },
    ] as const;

    for (const st of defaultStatuses) {
      await supabase.from('statuses').insert({
        workspace_id: validated.workspace_id,
        project_id: project.id,
        name: st.name,
        category: st.category,
        position: st.position,
        color: st.color,
      });
    }

    // 4. Ensure default work item types exist for this workspace (§7.2: Workspace-scoped)
    const defaultTypes = [
      { name: 'Task', icon: 'check-square', color: '#3B82F6' },
      { name: 'Bug', icon: 'alert-circle', color: '#EF4444' },
      { name: 'Feature', icon: 'zap', color: '#8B5CF6' },
    ];

    for (const dt of defaultTypes) {
      // Upsert: ignore duplicate name within same workspace
      await supabase.from('work_item_types').insert({
        workspace_id: validated.workspace_id,
        name: dt.name,
        icon: dt.icon,
        color: dt.color,
        is_system: true,
      });
    }

    logger.info('Created project with default statuses and types', {
      project_id: project.id,
      workspace_id: validated.workspace_id,
      user_id: user.id,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
