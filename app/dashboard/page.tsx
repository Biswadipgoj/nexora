import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';
import { isDemoRequest } from '@/lib/supabase/config';
import { DEMO_USER, DEMO_WORKSPACE, getDemoProjects, getDemoWorkItems } from '@/lib/demo/demo-store';
import { ensureDefaultProject } from '@/lib/db/ensure-project';
import { categoryForSlug, UUID_REGEX } from '@/lib/db/reference-ids';
import { withStatusCategories, type WorkItemData } from '@/lib/work/types';
import { DashboardClientView } from '@/components/dashboard/DashboardClientView';
import type { DashboardTab } from '@/components/dashboard/Sidebar';

export const metadata: Metadata = {
  title: 'Overview',
  description: 'Your projects, tasks and updates in one place.',
};

const TABS: DashboardTab[] = ['overview', 'inbox', 'tasks', 'projects'];

const WORK_ITEM_COLUMNS = `
  id, workspace_id, project_id, team_id, parent_id,
  type_id, status_id, sequence, title, description,
  priority, creator_id, start_date, due_date, estimate,
  position, sprint_id, completed_at, created_at, updated_at
`;

interface ProjectSummary {
  id: string;
  name: string;
  key: string;
  mode: string;
  description?: string | null;
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams;
  const initialTab = TABS.includes(params.tab as DashboardTab) ? (params.tab as DashboardTab) : 'overview';
  const cookieStore = await cookies();

  // Demo: the sample workspace, including any projects created in it.
  if (isDemoRequest(cookieStore)) {
    const items = getDemoWorkItems().map((item) => ({
      ...item,
      status_category: categoryForSlug(item.status_id),
    }));

    return (
      <DashboardClientView
        user={{ id: DEMO_USER.id, email: DEMO_USER.email, name: DEMO_USER.user_metadata.full_name }}
        primaryWorkspace={DEMO_WORKSPACE}
        projects={getDemoProjects().map((p) => ({
          id: p.id,
          name: p.name,
          key: p.key,
          mode: p.mode,
          description: p.description,
        }))}
        initialWorkItems={items as WorkItemData[]}
        isDemo
        initialTab={initialTab}
      />
    );
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name, slug, is_personal')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(20);

  // A new account names its workspace first. Previously the page invented a
  // workspace id ("ws-1a2b3c4d") and fake starter cards that could never be saved.
  if (!workspaces || workspaces.length === 0) redirect('/onboarding');

  const primaryWorkspace = workspaces.find((w) => !w.is_personal) ?? workspaces[0];

  const { data: projectRows } = await supabase
    .from('projects')
    .select('id, name, key, mode, description, created_at')
    .eq('workspace_id', primaryWorkspace.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100);

  let projects: ProjectSummary[] = (projectRows ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    key: p.key,
    mode: p.mode,
    description: p.description,
  }));

  if (projects.length === 0) {
    const created = await ensureDefaultProject(supabase, primaryWorkspace.id, user.id, primaryWorkspace.name);
    // A failed setup returns a placeholder id; show the empty state instead of a board that cannot save.
    if (created && UUID_REGEX.test(created.id)) projects = [{ ...created, description: null }];
  }

  let initialWorkItems: WorkItemData[] = [];
  if (projects.length > 0) {
    const projectIds = projects.map((p) => p.id);
    const [{ data: items }, { data: statuses }] = await Promise.all([
      supabase
        .from('work_items')
        .select(WORK_ITEM_COLUMNS)
        .in('project_id', projectIds)
        .is('deleted_at', null)
        .order('position', { ascending: true })
        .limit(200),
      supabase.from('statuses').select('id, category').in('project_id', projectIds),
    ]);
    initialWorkItems = withStatusCategories((items ?? []) as unknown as WorkItemData[], statuses ?? []);
  }

  const metadataName = user.user_metadata as Record<string, unknown> | undefined;
  const userName =
    (typeof metadataName?.full_name === 'string' && metadataName.full_name) ||
    (typeof metadataName?.name === 'string' && metadataName.name) ||
    user.email?.split('@')[0] ||
    'there';

  return (
    <DashboardClientView
      user={{ id: user.id, email: user.email, name: userName }}
      primaryWorkspace={{ id: primaryWorkspace.id, name: primaryWorkspace.name, slug: primaryWorkspace.slug }}
      projects={projects}
      initialWorkItems={initialWorkItems}
      isDemo={false}
      initialTab={initialTab}
    />
  );
}
