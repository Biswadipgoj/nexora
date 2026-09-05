import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Ensures that a workspace has at least one active project,
 * along with default agile statuses (To Do, In Progress, Done),
 * work item types (Task, Bug, Feature), and helpful starter work items
 * so fresh accounts immediately have an active, interactive workspace.
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

    let project = existing && existing.length > 0 ? existing[0] : null;

    if (!project) {
      // Generate a 2-4 letter uppercase key (e.g. Acme -> ACM, Dip -> DIP, fallback NEX)
      const cleanKey =
        workspaceName
          .replace(/[^a-zA-Z]/g, '')
          .slice(0, 3)
          .toUpperCase() || 'NEX';

      // 2. Insert default project
      const { data: newProj, error: projError } = await supabase
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

      if (projError || !newProj) {
        console.warn('[ensureDefaultProject] Project creation notice:', projError?.message);
        return null;
      }

      project = newProj;

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
    }

    // 6. Check if project has any work items; if 0, seed 3 interactive starter items
    const { count: itemCount } = await supabase
      .from('work_items')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', project.id)
      .is('deleted_at', null);

    if (itemCount === 0 || itemCount === null) {
      const [{ data: projectStatuses }, { data: workspaceTypes }] = await Promise.all([
        supabase
          .from('statuses')
          .select('id, category')
          .eq('project_id', project.id)
          .order('position', { ascending: true }),
        supabase
          .from('work_item_types')
          .select('id, name')
          .eq('workspace_id', workspaceId),
      ]);

      const todoStatus =
        projectStatuses?.find((s) => s.category === 'todo')?.id || projectStatuses?.[0]?.id;
      const inProgStatus =
        projectStatuses?.find((s) => s.category === 'in_progress')?.id || todoStatus;
      const doneStatus =
        projectStatuses?.find((s) => s.category === 'done')?.id || inProgStatus;

      const taskType =
        workspaceTypes?.find((t) => t.name === 'Task')?.id || workspaceTypes?.[0]?.id;
      const featureType =
        workspaceTypes?.find((t) => t.name === 'Feature')?.id || taskType;

      if (todoStatus && inProgStatus && doneStatus && taskType) {
        await supabase.from('work_items').insert([
          {
            workspace_id: workspaceId,
            project_id: project.id,
            sequence: 1,
            title: '🚀 Welcome to NEXORA! Click here to explore card details & attachments',
            status_id: todoStatus,
            type_id: taskType,
            priority: 1,
            creator_id: userId,
            position: 0,
          },
          {
            workspace_id: workspaceId,
            project_id: project.id,
            sequence: 2,
            title: '⚡ Try dragging this task to In Progress or Done across the board',
            status_id: inProgStatus,
            type_id: featureType || taskType,
            priority: 3,
            creator_id: userId,
            position: 1,
          },
          {
            workspace_id: workspaceId,
            project_id: project.id,
            sequence: 3,
            title: '✨ Click "+ Add card" or press "C" to create your first real work item',
            status_id: doneStatus,
            type_id: taskType,
            priority: 2,
            creator_id: userId,
            position: 2,
          },
        ]);
      }
    }

    return project;
  } catch (error) {
    console.error('[ensureDefaultProject] Exception:', error);
    return null;
  }
}
