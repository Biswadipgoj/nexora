-- ============================================================
-- NEXORA Migration 003: RLS Policies for Work Item Engine
-- §12: RLS as first-class security boundary
-- §12.4: with check on every UPDATE policy
-- §12.2: Force RLS on every tenant table
--
-- ROLLBACK: Drop all policies created here.
-- ============================================================

-- ============ RLS: PROJECTS ============
alter table projects enable row level security;
alter table projects force row level security;

create policy projects_select on projects
  for select using (
    workspace_id in (select auth_workspace_ids())
    and deleted_at is null
    and (
      -- Non-guests see all projects in their workspace
      not exists (
        select 1 from workspace_members m
        where m.workspace_id = projects.workspace_id
          and m.user_id = auth.uid()
          and m.role = 'guest'
      )
      -- Guests only see projects they are explicitly a member of
      or exists (
        select 1 from project_members p
        where p.project_id = projects.id
          and p.user_id = auth.uid()
      )
    )
  );

create policy projects_insert on projects
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
    and created_by = auth.uid()
  );

create policy projects_update on projects
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

create policy projects_delete on projects
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
  );


-- ============ RLS: PROJECT MEMBERS ============
alter table project_members enable row level security;
alter table project_members force row level security;

create policy project_members_select on project_members
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

create policy project_members_insert on project_members
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
  );

create policy project_members_update on project_members
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

create policy project_members_delete on project_members
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
  );


-- ============ RLS: WORK ITEM TYPES ============
alter table work_item_types enable row level security;
alter table work_item_types force row level security;

create policy work_item_types_select on work_item_types
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

create policy work_item_types_insert on work_item_types
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
  );

create policy work_item_types_update on work_item_types
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

create policy work_item_types_delete on work_item_types
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
  );


-- ============ RLS: LABELS ============
alter table labels enable row level security;
alter table labels force row level security;

create policy labels_select on labels
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

create policy labels_insert on labels
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  );

create policy labels_update on labels
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

create policy labels_delete on labels
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
  );


-- ============ RLS: STATUSES ============
alter table statuses enable row level security;
alter table statuses force row level security;

create policy statuses_select on statuses
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

create policy statuses_insert on statuses
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  );

create policy statuses_update on statuses
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

create policy statuses_delete on statuses
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
  );


-- ============ RLS: SPRINTS ============
alter table sprints enable row level security;
alter table sprints force row level security;

create policy sprints_select on sprints
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

create policy sprints_insert on sprints
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  );

create policy sprints_update on sprints
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

create policy sprints_delete on sprints
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
  );


-- ============ RLS: WORK ITEMS ============
-- The most critical table — all policies per §12.4
alter table work_items enable row level security;
alter table work_items force row level security;

create policy work_items_select on work_items
  for select using (
    workspace_id in (select auth_workspace_ids())
    and deleted_at is null
    and (
      -- Non-guests see all items in their workspace
      not exists (
        select 1 from workspace_members m
        where m.workspace_id = work_items.workspace_id
          and m.user_id = auth.uid()
          and m.role = 'guest'
      )
      -- Guests only see work items they are explicitly assigned to (strict access control)
      or exists (
        select 1 from work_item_assignees a
        where a.work_item_id = work_items.id
          and a.user_id = auth.uid()
      )
    )
  );

create policy work_items_insert on work_items
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
    and creator_id = auth.uid()
  );

-- §12.4: with check blocks moving an item between tenants
create policy work_items_update on work_items
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

create policy work_items_delete on work_items
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
  );


-- ============ RLS: WORK ITEM ASSIGNEES ============
alter table work_item_assignees enable row level security;
alter table work_item_assignees force row level security;

create policy wi_assignees_select on work_item_assignees
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

create policy wi_assignees_insert on work_item_assignees
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  );

create policy wi_assignees_delete on work_item_assignees
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  );


-- ============ RLS: WORK ITEM WATCHERS ============
alter table work_item_watchers enable row level security;
alter table work_item_watchers force row level security;

create policy wi_watchers_select on work_item_watchers
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

create policy wi_watchers_insert on work_item_watchers
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    -- Any member can watch
  );

create policy wi_watchers_delete on work_item_watchers
  for delete using (
    workspace_id in (select auth_workspace_ids())
    -- Can unwatch (remove self or admin removes others)
    and (user_id = auth.uid() or has_workspace_role(workspace_id, 'admin'))
  );


-- ============ RLS: WORK ITEM LABELS ============
alter table work_item_labels enable row level security;
alter table work_item_labels force row level security;

create policy wi_labels_select on work_item_labels
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

create policy wi_labels_insert on work_item_labels
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  );

create policy wi_labels_delete on work_item_labels
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  );


-- ============ RLS: WORK ITEM DEPENDENCIES ============
alter table work_item_dependencies enable row level security;
alter table work_item_dependencies force row level security;

create policy wi_deps_select on work_item_dependencies
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

create policy wi_deps_insert on work_item_dependencies
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  );

create policy wi_deps_delete on work_item_dependencies
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  );


-- ============ RLS: CUSTOM FIELDS ============
alter table custom_field_definitions enable row level security;
alter table custom_field_definitions force row level security;

create policy cfd_select on custom_field_definitions
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

create policy cfd_insert on custom_field_definitions
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
    and created_by = auth.uid()
  );

create policy cfd_update on custom_field_definitions
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

create policy cfd_delete on custom_field_definitions
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
  );

alter table custom_field_values enable row level security;
alter table custom_field_values force row level security;

create policy cfv_select on custom_field_values
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

create policy cfv_insert on custom_field_values
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  );

create policy cfv_update on custom_field_values
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

create policy cfv_delete on custom_field_values
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  );


-- ============ RLS: COMMENTS ============
alter table comments enable row level security;
alter table comments force row level security;

create policy comments_select on comments
  for select using (
    workspace_id in (select auth_workspace_ids())
    and deleted_at is null
  );

create policy comments_insert on comments
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
    and author_id = auth.uid()
  );

create policy comments_update on comments
  for update using (
    workspace_id in (select auth_workspace_ids())
    and author_id = auth.uid()
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

create policy comments_delete on comments
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and (author_id = auth.uid() or has_workspace_role(workspace_id, 'manager'))
  );


-- ============ RLS: ATTACHMENTS ============
alter table attachments enable row level security;
alter table attachments force row level security;

create policy attachments_select on attachments
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

create policy attachments_insert on attachments
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
    and uploaded_by = auth.uid()
  );

create policy attachments_delete on attachments
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and (uploaded_by = auth.uid() or has_workspace_role(workspace_id, 'manager'))
  );


-- ============ RLS: ACTIVITY EVENTS ============
alter table activity_events enable row level security;
alter table activity_events force row level security;

create policy activity_events_select on activity_events
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

create policy activity_events_insert on activity_events
  for insert with check (
    workspace_id in (select auth_workspace_ids())
  );


-- ============ RLS: DOCUMENTS ============
alter table documents enable row level security;
alter table documents force row level security;

create policy documents_select on documents
  for select using (
    workspace_id in (select auth_workspace_ids())
    and deleted_at is null
  );

create policy documents_insert on documents
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
    and created_by = auth.uid()
  );

create policy documents_update on documents
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

create policy documents_delete on documents
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and (created_by = auth.uid() or has_workspace_role(workspace_id, 'manager'))
  );


-- ============ RLS: GOALS ============
alter table goals enable row level security;
alter table goals force row level security;

create policy goals_select on goals
  for select using (
    workspace_id in (select auth_workspace_ids())
    and deleted_at is null
  );

create policy goals_insert on goals
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
    and owner_id = auth.uid()
  );

create policy goals_update on goals
  for update using (
    workspace_id in (select auth_workspace_ids())
    and (owner_id = auth.uid() or has_workspace_role(workspace_id, 'manager'))
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

create policy goals_delete on goals
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and (owner_id = auth.uid() or has_workspace_role(workspace_id, 'manager'))
  );

alter table goal_work_items enable row level security;
alter table goal_work_items force row level security;

create policy gwi_select on goal_work_items
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

create policy gwi_insert on goal_work_items
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  );

create policy gwi_delete on goal_work_items
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  );


-- ============ RLS: TIME ENTRIES ============
alter table time_entries enable row level security;
alter table time_entries force row level security;

create policy time_entries_select on time_entries
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

create policy time_entries_insert on time_entries
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
    and user_id = auth.uid()
  );

-- §29: Editing another user's entry requires Manager role
create policy time_entries_update on time_entries
  for update using (
    workspace_id in (select auth_workspace_ids())
    and (user_id = auth.uid() or has_workspace_role(workspace_id, 'manager'))
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

create policy time_entries_delete on time_entries
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and (user_id = auth.uid() or has_workspace_role(workspace_id, 'manager'))
  );


-- ============ RLS: NOTIFICATIONS ============
alter table notifications enable row level security;
alter table notifications force row level security;

-- Users can only see their own notifications
create policy notifications_select on notifications
  for select using (
    user_id = auth.uid()
  );

create policy notifications_insert on notifications
  for insert with check (
    workspace_id in (select auth_workspace_ids())
  );

create policy notifications_update on notifications
  for update using (
    user_id = auth.uid()
  ) with check (
    user_id = auth.uid()
  );

create policy notifications_delete on notifications
  for delete using (
    user_id = auth.uid()
  );


-- ============ RLS: NOTIFICATION PREFERENCES ============
alter table notification_preferences enable row level security;
alter table notification_preferences force row level security;

create policy notif_prefs_select on notification_preferences
  for select using (user_id = auth.uid());

create policy notif_prefs_insert on notification_preferences
  for insert with check (user_id = auth.uid());

create policy notif_prefs_update on notification_preferences
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy notif_prefs_delete on notification_preferences
  for delete using (user_id = auth.uid());


-- ============ RLS: SAVED VIEWS ============
alter table saved_views enable row level security;
alter table saved_views force row level security;

create policy saved_views_select on saved_views
  for select using (
    workspace_id in (select auth_workspace_ids())
    and (user_id = auth.uid() or is_shared = true)
  );

create policy saved_views_insert on saved_views
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and user_id = auth.uid()
  );

create policy saved_views_update on saved_views
  for update using (
    workspace_id in (select auth_workspace_ids())
    and user_id = auth.uid()
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

create policy saved_views_delete on saved_views
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and user_id = auth.uid()
  );


-- ============ RLS: INVITATIONS ============
alter table invitations enable row level security;
alter table invitations force row level security;

create policy invitations_select on invitations
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

create policy invitations_insert on invitations
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
    and invited_by = auth.uid()
  );

create policy invitations_delete on invitations
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
  );


-- ============ RLS: AUDIT LOG ============
-- §21: Visible to admins only
alter table audit_log enable row level security;
alter table audit_log force row level security;

create policy audit_log_select on audit_log
  for select using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
  );

create policy audit_log_insert on audit_log
  for insert with check (
    workspace_id in (select auth_workspace_ids())
  );


-- ============ RLS: FEATURE FLAGS ============
-- Feature flags are global (no workspace_id) but read-only for app
alter table feature_flags enable row level security;
alter table feature_flags force row level security;

create policy feature_flags_select on feature_flags
  for select using (true);  -- all authenticated users can read flags
