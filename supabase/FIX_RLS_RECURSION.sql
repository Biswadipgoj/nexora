-- ====================================================================
-- NEXORA: Instant RLS Recursion Fix & Workspace Access
-- Run this in Supabase SQL Editor to eliminate 42P17 infinite recursion
-- and enable instant, zero-delay workspace, project & task loading!
-- ====================================================================

-- 1. Remove FORCE RLS on workspace_members so security definer functions can query without loop
alter table workspace_members no force row level security;
alter table workspaces no force row level security;
alter table projects no force row level security;

-- 2. Fix ws_members_select to avoid circular recursion
drop policy if exists ws_members_select on workspace_members;
create policy ws_members_select on workspace_members
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from workspaces w
      where w.id = workspace_members.workspace_id
        and w.owner_id = auth.uid()
    )
  );

-- 3. Fix ws_members_insert so workspace creator can always add themselves as owner
drop policy if exists ws_members_insert on workspace_members;
create policy ws_members_insert on workspace_members
  for insert with check (
    user_id = auth.uid()
    or exists (
      select 1 from workspaces w
      where w.id = workspace_members.workspace_id
        and w.owner_id = auth.uid()
    )
  );

-- 4. Fix projects_insert to allow workspace owners to create projects instantly
drop policy if exists projects_insert on projects;
create policy projects_insert on projects
  for insert with check (
    created_by = auth.uid()
    and (
      exists (
        select 1 from workspaces w
        where w.id = projects.workspace_id
          and w.owner_id = auth.uid()
      )
      or (
        workspace_id in (select auth_workspace_ids())
        and has_workspace_role(workspace_id, 'member')
      )
    )
  );

-- 5. Fix projects_select
drop policy if exists projects_select on projects;
create policy projects_select on projects
  for select using (
    deleted_at is null
    and (
      created_by = auth.uid()
      or exists (
        select 1 from workspaces w
        where w.id = projects.workspace_id
          and w.owner_id = auth.uid()
      )
      or workspace_id in (select auth_workspace_ids())
    )
  );

-- 6. Fix statuses_insert
drop policy if exists statuses_insert on statuses;
create policy statuses_insert on statuses
  for insert with check (
    exists (
      select 1 from workspaces w
      where w.id = statuses.workspace_id
        and w.owner_id = auth.uid()
    )
    or (
      workspace_id in (select auth_workspace_ids())
      and has_workspace_role(workspace_id, 'manager')
    )
  );

-- 7. Fix statuses_select
drop policy if exists statuses_select on statuses;
create policy statuses_select on statuses
  for select using (
    exists (
      select 1 from workspaces w
      where w.id = statuses.workspace_id
        and w.owner_id = auth.uid()
    )
    or workspace_id in (select auth_workspace_ids())
  );

-- 8. Fix work_item_types_insert & select
drop policy if exists work_item_types_insert on work_item_types;
create policy work_item_types_insert on work_item_types
  for insert with check (
    exists (
      select 1 from workspaces w
      where w.id = work_item_types.workspace_id
        and w.owner_id = auth.uid()
    )
    or (
      workspace_id in (select auth_workspace_ids())
      and has_workspace_role(workspace_id, 'admin')
    )
  );

drop policy if exists work_item_types_select on work_item_types;
create policy work_item_types_select on work_item_types
  for select using (
    is_system = true
    or exists (
      select 1 from workspaces w
      where w.id = work_item_types.workspace_id
        and w.owner_id = auth.uid()
    )
    or workspace_id in (select auth_workspace_ids())
  );

-- 9. Fix work_items_insert & select
drop policy if exists work_items_insert on work_items;
create policy work_items_insert on work_items
  for insert with check (
    creator_id = auth.uid()
    and (
      exists (
        select 1 from workspaces w
        where w.id = work_items.workspace_id
          and w.owner_id = auth.uid()
      )
      or (
        workspace_id in (select auth_workspace_ids())
        and has_workspace_role(workspace_id, 'member')
      )
    )
  );

drop policy if exists work_items_select on work_items;
create policy work_items_select on work_items
  for select using (
    deleted_at is null
    and (
      creator_id = auth.uid()
      or exists (
        select 1 from workspaces w
        where w.id = work_items.workspace_id
          and w.owner_id = auth.uid()
      )
      or workspace_id in (select auth_workspace_ids())
    )
  );
