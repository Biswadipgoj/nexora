import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, WorkspaceRole } from '@/lib/db/types';
import { resolveEffectiveRole } from '@/lib/auth/rbac';

export interface ProjectAccess {
  project: { id: string; workspace_id: string; name: string; key: string };
  role: WorkspaceRole | null;
}

/**
 * Resolves the caller's effective role on a project (§12.3), or null when the
 * project is not visible to them. RLS decides visibility; the role decides
 * what they may do with invitations.
 */
export async function getProjectAccess(
  supabase: SupabaseClient<Database>,
  projectId: string,
  userId: string
): Promise<ProjectAccess | null> {
  const { data: project } = await supabase
    .from('projects')
    .select('id, workspace_id, name, key')
    .eq('id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!project) return null;

  const [{ data: wsMember }, { data: projectMember }] = await Promise.all([
    supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', project.workspace_id)
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  const role = resolveEffectiveRole({
    workspaceRole: (wsMember?.role as WorkspaceRole | undefined) ?? null,
    projectRole: (projectMember?.role as WorkspaceRole | undefined) ?? null,
  });

  return { project, role };
}
