import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Ensures that a workspace has at least one active project,
 * along with default agile statuses (To Do, In Progress, Done)
 * and work item types (Task, Bug, Feature).
 */
export async function ensureDefaultProject(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  userId: string,
  workspaceName: string
) {
  try {
    // 1. Check if an active project already exists
    const { data: existing, error: fetchErr } = await supabase
      .from('projects')
      .select('id, name, key, mode, is_personal')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .limit(1);

    if (!fetchErr && existing && existing.length > 0) {
      return existing[0];
    }

    // Generate a 2-4 letter uppercase key (e.g. Acme -> ACM, Dip -> DIP, fallback NEX)
    const cleanKey =
      workspaceName
        .replace(/[^a-zA-Z]/g, '')
        .slice(0, 3)
        .toUpperCase() || 'NEX';

    // 2. Insert default project
    const { data: project, error: projError } = await supabase
      .from('projects')
      .insert({
        workspace_id: workspaceId,
        name: `${workspaceName} Project`,
        key: cleanKey,
        mode: 'advanced',
        is_personal: false,
        created_by: userId,
      })
      .select('id, name, key, mode, is_personal')
      .single();

    if (projError || !project) {
      console.warn('[ensureDefaultProject] Project creation notice:', projError?.message);
      return null;
    }

    // 3. Add creator as project manager
    await supabase.from('project_members').insert({
      project_id: project.id,
      user_id: userId,
      workspace_id: workspaceId,
      role: 'manager',
    });

    // 4. Create default agile statuses
    const defaultStatuses = [
      { name: 'To Do', category: 'todo', position: 0, color: '#6366F1' },
      { name: 'In Progress', category: 'in_progress', position: 1, color: '#8B5CF6' },
      { name: 'Done', category: 'done', position: 2, color: '#10B981' },
    ] as const;

    for (const st of defaultStatuses) {
      await supabase.from('statuses').insert({
        workspace_id: workspaceId,
        project_id: project.id,
        name: st.name,
        category: st.category,
        position: st.position,
        color: st.color,
      });
    }

    // 5. Create default work item types
    const defaultTypes = [
      { name: 'Task', icon: 'check-square', color: '#3B82F6' },
      { name: 'Bug', icon: 'alert-circle', color: '#EF4444' },
      { name: 'Feature', icon: 'zap', color: '#8B5CF6' },
    ];

    for (const dt of defaultTypes) {
      await supabase.from('work_item_types').insert({
        workspace_id: workspaceId,
        name: dt.name,
        icon: dt.icon,
        color: dt.color,
        is_system: true,
      });
    }

    return project;
  } catch (error) {
    console.error('[ensureDefaultProject] Exception:', error);
    return null;
  }
}
