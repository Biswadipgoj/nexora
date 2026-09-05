import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';
import { DEMO_USER, DEMO_WORKSPACE, DEMO_PROJECT, getDemoWorkItems } from '@/lib/demo/demo-store';
import { ensureDefaultProject } from '@/lib/db/ensure-project';
import { DashboardClientView } from '@/components/dashboard/DashboardClientView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard — NEXORA',
  description: 'Manage your workspaces, active agile projects, notifications, and personal tasks.',
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get('nexora_demo_session')?.value === 'true';

  const supabase = await createServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  const user = isDemo ? DEMO_USER : authUser;

  if (!user) {
    redirect('/auth/login');
  }

  let projects: Array<{ id: string; name: string; key: string; mode: string; is_personal?: boolean }> = [];
  let primaryWorkspace: {
    id: string;
    name: string;
    slug: string;
    is_personal: boolean;
  } = DEMO_WORKSPACE;

  if (isDemo) {
    projects = [DEMO_PROJECT];
    primaryWorkspace = DEMO_WORKSPACE;
  } else {
    // Fetch workspaces
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id, name, slug, is_personal')
      .limit(8);

    const hasWorkspaces = workspaces && workspaces.length > 0;

    if (!hasWorkspaces) {
      redirect('/onboarding');
    }

    primaryWorkspace = workspaces.find((w) => !w.is_personal) ?? workspaces[0];

    // Fetch projects in workspace
    const { data: projs } = await supabase
      .from('projects')
      .select('id, name, key, mode, is_personal')
      .eq('workspace_id', primaryWorkspace.id)
      .is('deleted_at', null)
      .limit(8);

    projects = projs ?? [];

    // If workspace has no projects, automatically ensure a default agile project exists
    if (projects.length === 0) {
      const defaultProj = await ensureDefaultProject(
        supabase,
        primaryWorkspace.id,
        user.id,
        primaryWorkspace.name
      );
      if (defaultProj) {
        projects = [defaultProj];
      }
    }
  }

  // Fetch initial work items for the active project
  let initialWorkItems: any[] = [];
  if (isDemo) {
    initialWorkItems = getDemoWorkItems();
  } else if (projects.length > 0) {
    try {
      const { data: dbItems } = await supabase
        .from('work_items')
        .select(`
          id, workspace_id, project_id, team_id, parent_id,
          type_id, status_id, sequence, title, description,
          priority, creator_id, start_date, due_date, estimate,
          position, sprint_id, completed_at, created_at, updated_at
        `)
        .eq('project_id', projects[0].id)
        .is('deleted_at', null)
        .order('position', { ascending: true })
        .limit(50);

      initialWorkItems = dbItems ?? [];
    } catch (fetchErr) {
      console.warn('[DashboardPage] Initial work items notice:', fetchErr);
    }
  }

  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const userName =
    (typeof metadata?.full_name === 'string' && metadata.full_name) ||
    (typeof metadata?.name === 'string' && metadata.name) ||
    user.email?.split('@')[0] ||
    'User';

  return (
    <DashboardClientView
      user={{
        id: user.id,
        email: user.email,
        name: userName,
        avatar: user.user_metadata?.avatar_url || '',
      }}
      primaryWorkspace={{
        id: primaryWorkspace.id,
        name: primaryWorkspace.name,
        slug: primaryWorkspace.slug,
      }}
      projects={projects.map((p) => ({
        id: p.id,
        name: p.name,
        key: p.key,
        mode: p.mode,
      }))}
      initialWorkItems={initialWorkItems}
      isDemo={isDemo}
    />
  );
}
