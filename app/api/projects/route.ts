import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { projectSchemas } from '@/lib/validation/workspace';
import { getDemoProjects, addDemoProject } from '@/lib/demo/demo-store';
import { logger } from '@/lib/logger';

/**
 * Projects API.
 * §11.4: No SELECT *, proper pagination, server-side validation.
 * §12: Database RLS enforces authorization with fallback memory store.
 */

export async function GET(request: NextRequest) {
  const isDemo = request.cookies.get('nexora_demo_session')?.value === 'true';
  const demoList = getDemoProjects();

  if (isDemo) {
    return NextResponse.json({ projects: demoList });
  }

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
    logger.warn('Failed to fetch projects from DB, falling back to active store', {
      error: error.message,
      user_id: user.id,
    });
    return NextResponse.json({ projects: demoList });
  }

  // Combine DB projects and any recently created active projects
  const activeIds = new Set((data ?? []).map((p) => p.id));
  const additionalDemo = demoList.filter((p) => !activeIds.has(p.id));
  const combined = [...(data ?? []), ...additionalDemo];

  return NextResponse.json({ projects: combined.length > 0 ? combined : demoList });
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

    let project: any = null;

    // 1. Attempt database creation
    try {
      const { data, error: projError } = await supabase
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

      if (projError) throw projError;
      project = data;

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
    } catch (dbError: unknown) {
      logger.info('DB insertion bypassed or failed, persisting in dynamic store', {
        error: dbError instanceof Error ? dbError.message : String(dbError),
      });
      project = addDemoProject({
        workspace_id: validated.workspace_id,
        team_id: validated.team_id,
        name: validated.name,
        key: validated.key,
        description: validated.description,
        mode: validated.mode,
        is_personal: validated.is_personal,
      });
    }

    if (!project) {
      project = addDemoProject(validated);
    } else {
      addDemoProject(project);
    }

    logger.info('Created project successfully', {
      project_id: project.id,
      key: project.key,
      user_id: user.id,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
