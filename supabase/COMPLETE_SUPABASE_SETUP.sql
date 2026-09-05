-- ============================================================
-- NEXORA COMPLETE MASTER DATABASE SETUP SCRIPT
-- One-Click, Fully Idempotent PostgreSQL & RLS Setup for Supabase
--
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project -> Go to SQL Editor -> "+ New Query"
-- 3. Paste this ENTIRE file into the editor and click "RUN"
-- 4. Result: All tables, types, triggers, and RLS policies created!
-- ============================================================

-- 0. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 1. Helper function for updated_at timestamp maintenance
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 2. Create workspace_role enum safely
do $$ begin
  create type workspace_role as enum (
    'owner', 'admin', 'manager', 'member', 'viewer', 'guest'
  );
exception
  when duplicate_object then null;
end $$;

-- 3. Workspaces (Tenant root)
create table if not exists workspaces (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (length(name) between 1 and 100),
  slug          text not null unique,
  is_personal   boolean not null default false,
  owner_id      uuid not null references auth.users(id),
  plan          text not null default 'free',
  settings      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

drop trigger if exists workspaces_updated_at on workspaces;
create trigger workspaces_updated_at
  before update on workspaces
  for each row execute function update_updated_at_column();

-- 4. Workspace Members
create table if not exists workspace_members (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          workspace_role not null default 'member',
  invited_by    uuid references auth.users(id),
  joined_at     timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index if not exists idx_ws_members_user on workspace_members(user_id);
create index if not exists idx_ws_members_ws   on workspace_members(workspace_id);

-- 5. Teams
create table if not exists teams (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  name          text not null check (length(name) between 1 and 100),
  key           text not null check (length(key) between 1 and 10),
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  unique (workspace_id, key)
);

create index if not exists idx_teams_ws on teams(workspace_id) where deleted_at is null;

drop trigger if exists teams_updated_at on teams;
create trigger teams_updated_at
  before update on teams
  for each row execute function update_updated_at_column();

-- 6. Team Members
create table if not exists team_members (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid not null references teams(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  role          workspace_role not null default 'member',
  unique (team_id, user_id)
);

create index if not exists idx_team_members_team on team_members(team_id);
create index if not exists idx_team_members_user on team_members(user_id);
create index if not exists idx_team_members_ws   on team_members(workspace_id);

-- 7. Security Definer Helper Functions
create or replace function auth_workspace_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select workspace_id from workspace_members where user_id = auth.uid();
$$;

create or replace function has_workspace_role(ws uuid, min_role workspace_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws
      and user_id = auth.uid()
      and array_position(
            array['guest','viewer','member','manager','admin','owner']::workspace_role[], role)
          >= array_position(
            array['guest','viewer','member','manager','admin','owner']::workspace_role[], min_role)
  );
$$;

create or replace function get_workspace_role(ws uuid)
returns workspace_role
language sql stable security definer set search_path = public
as $$
  select role from workspace_members
  where workspace_id = ws and user_id = auth.uid();
$$;

-- 8. Foundation RLS Policies
alter table workspaces enable row level security;
alter table workspaces force row level security;

drop policy if exists workspaces_select on workspaces;
create policy workspaces_select on workspaces
  for select using (
    (id in (select auth_workspace_ids()) or owner_id = auth.uid())
    and deleted_at is null
  );

drop policy if exists workspaces_insert on workspaces;
create policy workspaces_insert on workspaces
  for insert with check (
    owner_id = auth.uid()
  );

drop policy if exists workspaces_update on workspaces;
create policy workspaces_update on workspaces
  for update using (
    id in (select auth_workspace_ids())
    and has_workspace_role(id, 'admin')
  ) with check (
    id in (select auth_workspace_ids())
  );

drop policy if exists workspaces_delete on workspaces;
create policy workspaces_delete on workspaces
  for delete using (
    id in (select auth_workspace_ids())
    and has_workspace_role(id, 'owner')
  );

alter table workspace_members enable row level security;
alter table workspace_members force row level security;

drop policy if exists ws_members_select on workspace_members;
create policy ws_members_select on workspace_members
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists ws_members_insert on workspace_members;
create policy ws_members_insert on workspace_members
  for insert with check (
    has_workspace_role(workspace_id, 'admin')
    or (
      user_id = auth.uid()
      and role = 'owner'
      and (
        not exists (
          select 1 from workspace_members wm
          where wm.workspace_id = workspace_members.workspace_id
        )
        or exists (
          select 1 from workspaces w
          where w.id = workspace_members.workspace_id
            and w.owner_id = auth.uid()
        )
      )
    )
  );

drop policy if exists ws_members_update on workspace_members;
create policy ws_members_update on workspace_members
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists ws_members_delete on workspace_members;
create policy ws_members_delete on workspace_members
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and (
      has_workspace_role(workspace_id, 'admin')
      or user_id = auth.uid()
    )
  );

alter table teams enable row level security;
alter table teams force row level security;

drop policy if exists teams_select on teams;
create policy teams_select on teams
  for select using (
    workspace_id in (select auth_workspace_ids())
    and deleted_at is null
  );

drop policy if exists teams_insert on teams;
create policy teams_insert on teams
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
  );

drop policy if exists teams_update on teams;
create policy teams_update on teams
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists teams_delete on teams;
create policy teams_delete on teams
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
  );

alter table team_members enable row level security;
alter table team_members force row level security;

drop policy if exists team_members_select on team_members;
create policy team_members_select on team_members
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists team_members_insert on team_members;
create policy team_members_insert on team_members
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
  );

drop policy if exists team_members_update on team_members;
create policy team_members_update on team_members
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists team_members_delete on team_members;
create policy team_members_delete on team_members
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
  );

-- 9. Projects Table
create table if not exists projects (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  team_id       uuid references teams(id) on delete set null,
  name          text not null check (length(name) between 1 and 100),
  key           text not null check (length(key) between 1 and 10),
  description   text,
  mode          text not null default 'simple' check (mode in ('simple', 'advanced')),
  is_personal   boolean not null default false,
  item_counter  bigint not null default 0,
  archived_at   timestamptz,
  created_by    uuid not null references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  unique (workspace_id, key)
);

create index if not exists idx_projects_ws on projects(workspace_id) where deleted_at is null;
create index if not exists idx_projects_team on projects(team_id) where team_id is not null;

drop trigger if exists projects_updated_at on projects;
create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at_column();

-- 10. Project Members
create table if not exists project_members (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  role          workspace_role not null default 'member',
  unique (project_id, user_id)
);

create index if not exists idx_project_members_user on project_members(user_id);
create index if not exists idx_project_members_project on project_members(project_id);
create index if not exists idx_project_members_ws on project_members(workspace_id);

-- 11. Work Item Types
create table if not exists work_item_types (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  name          text not null check (length(name) between 1 and 50),
  icon          text,
  color         text,
  is_system     boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (workspace_id, name)
);

create index if not exists idx_work_item_types_ws on work_item_types(workspace_id);

-- 12. Labels
create table if not exists labels (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  name          text not null check (length(name) between 1 and 50),
  color         text not null default '#6B7280',
  created_at    timestamptz not null default now(),
  unique (workspace_id, lower(name))
);

create index if not exists idx_labels_ws on labels(workspace_id);

-- 13. Statuses
create table if not exists statuses (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  project_id    uuid not null references projects(id) on delete cascade,
  name          text not null check (length(name) between 1 and 50),
  category      text not null check (category in ('todo', 'in_progress', 'done', 'cancelled')),
  position      integer not null,
  color         text not null default '#6B7280',
  created_at    timestamptz not null default now(),
  unique (project_id, name)
);

create index if not exists idx_statuses_project on statuses(project_id);

-- 14. Sprints
create table if not exists sprints (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  project_id    uuid not null references projects(id) on delete cascade,
  name          text not null check (length(name) between 1 and 100),
  goal          text,
  start_date    date,
  end_date      date,
  status        text not null default 'planned' check (status in ('planned', 'active', 'completed')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_sprints_project on sprints(project_id);

drop trigger if exists sprints_updated_at on sprints;
create trigger sprints_updated_at
  before update on sprints
  for each row execute function update_updated_at_column();

-- 15. Work Items
create table if not exists work_items (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references workspaces(id) on delete cascade,
  project_id     uuid not null references projects(id) on delete cascade,
  team_id        uuid references teams(id) on delete set null,
  parent_id      uuid references work_items(id) on delete cascade,
  type_id        uuid not null references work_item_types(id),
  status_id      uuid not null references statuses(id),
  sequence       bigint not null,
  title          text not null check (length(title) between 1 and 500),
  description    jsonb,
  priority       smallint not null default 0 check (priority between 0 and 4),
  creator_id     uuid not null references auth.users(id),
  start_date     date,
  due_date       date,
  estimate       numeric(10,2),
  position       numeric not null default 0,
  sprint_id      uuid references sprints(id) on delete set null,
  completed_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  unique (project_id, sequence)
);

create index if not exists idx_wi_board       on work_items(project_id, status_id, position) where deleted_at is null;
create index if not exists idx_wi_workspace   on work_items(workspace_id, updated_at desc)  where deleted_at is null;
create index if not exists idx_wi_parent      on work_items(parent_id)  where parent_id is not null;
create index if not exists idx_wi_due         on work_items(workspace_id, due_date) where due_date is not null and deleted_at is null;
create index if not exists idx_wi_creator     on work_items(creator_id) where deleted_at is null;
create index if not exists idx_wi_sprint      on work_items(sprint_id)  where sprint_id is not null and deleted_at is null;
create index if not exists idx_wi_type        on work_items(type_id);

drop trigger if exists work_items_updated_at on work_items;
create trigger work_items_updated_at
  before update on work_items
  for each row execute function update_updated_at_column();

-- 16. Work Item Junction Tables
create table if not exists work_item_assignees (
  work_item_id  uuid not null references work_items(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  assigned_at   timestamptz not null default now(),
  primary key (work_item_id, user_id)
);

create index if not exists idx_wi_assignee_user on work_item_assignees(user_id, workspace_id);

create table if not exists work_item_watchers (
  work_item_id  uuid not null references work_items(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  primary key (work_item_id, user_id)
);

create index if not exists idx_wi_watchers_user on work_item_watchers(user_id, workspace_id);

create table if not exists work_item_labels (
  work_item_id  uuid not null references work_items(id) on delete cascade,
  label_id      uuid not null references labels(id) on delete cascade,
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  primary key (work_item_id, label_id)
);

create table if not exists work_item_dependencies (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references workspaces(id) on delete cascade,
  from_item_id   uuid not null references work_items(id) on delete cascade,
  to_item_id     uuid not null references work_items(id) on delete cascade,
  type           text not null check (type in ('blocks', 'relates_to', 'duplicates')),
  unique (from_item_id, to_item_id, type),
  check (from_item_id <> to_item_id)
);

-- 17. Custom Fields
create table if not exists custom_field_definitions (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  name          text not null check (length(name) between 1 and 100),
  field_type    text not null check (field_type in
                  ('text', 'number', 'date', 'select', 'multi_select', 'checkbox', 'url', 'user')),
  options       jsonb,
  created_by    uuid not null references auth.users(id),
  created_at    timestamptz not null default now(),
  unique (workspace_id, lower(name))
);

create index if not exists idx_cfd_ws on custom_field_definitions(workspace_id);

create table if not exists custom_field_values (
  work_item_id  uuid not null references work_items(id) on delete cascade,
  field_id      uuid not null references custom_field_definitions(id) on delete cascade,
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  value         jsonb,
  primary key (work_item_id, field_id)
);

create index if not exists idx_cfv_field on custom_field_values(field_id);

-- 18. Comments & Attachments
create table if not exists comments (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  work_item_id  uuid references work_items(id) on delete cascade,
  document_id   uuid,
  author_id     uuid not null references auth.users(id),
  body          jsonb not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create index if not exists idx_comments_item on comments(work_item_id, created_at) where deleted_at is null;

drop trigger if exists comments_updated_at on comments;
create trigger comments_updated_at
  before update on comments
  for each row execute function update_updated_at_column();

create table if not exists attachments (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  work_item_id  uuid references work_items(id) on delete cascade,
  storage_path  text not null,
  file_name     text not null check (length(file_name) between 1 and 255),
  mime_type     text not null,
  size_bytes    bigint not null check (size_bytes > 0),
  uploaded_by   uuid not null references auth.users(id),
  created_at    timestamptz not null default now()
);

create index if not exists idx_attachments_item on attachments(work_item_id);
create index if not exists idx_attachments_ws on attachments(workspace_id);

-- 19. Activity Events
create table if not exists activity_events (
  id            uuid not null default gen_random_uuid(),
  workspace_id  uuid not null,
  entity_type   text not null,
  entity_id     uuid not null,
  actor_id      uuid,
  action        text not null,
  changes       jsonb,
  created_at    timestamptz not null default now(),
  primary key (id, created_at)
) partition by range (created_at);

create table if not exists activity_events_default partition of activity_events default;

create index if not exists idx_activity_entity on activity_events(entity_id, created_at desc);
create index if not exists idx_activity_ws on activity_events(workspace_id, created_at desc);

-- 20. Documents, Goals, Time Entries, Views
create table if not exists documents (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  project_id    uuid references projects(id) on delete cascade,
  title         text not null check (length(title) between 1 and 200),
  content       jsonb not null default '{}'::jsonb,
  created_by    uuid not null references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create index if not exists idx_documents_project on documents(project_id) where deleted_at is null;
create index if not exists idx_documents_ws on documents(workspace_id) where deleted_at is null;

drop trigger if exists documents_updated_at on documents;
create trigger documents_updated_at
  before update on documents
  for each row execute function update_updated_at_column();

create table if not exists goals (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references workspaces(id) on delete cascade,
  title          text not null check (length(title) between 1 and 200),
  description    text,
  owner_id       uuid not null references auth.users(id),
  scope          text not null check (scope in ('personal', 'team', 'project')),
  scope_id       uuid,
  target_date    date,
  status         text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  progress       numeric(5,2) not null default 0,
  progress_mode  text not null default 'manual' check (progress_mode in ('auto', 'manual', 'numeric')),
  target_value   numeric,
  current_value  numeric,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

create index if not exists idx_goals_ws on goals(workspace_id) where deleted_at is null;
create index if not exists idx_goals_owner on goals(owner_id) where deleted_at is null;

drop trigger if exists goals_updated_at on goals;
create trigger goals_updated_at
  before update on goals
  for each row execute function update_updated_at_column();

create table if not exists goal_work_items (
  goal_id       uuid not null references goals(id) on delete cascade,
  work_item_id  uuid not null references work_items(id) on delete cascade,
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  primary key (goal_id, work_item_id)
);

create table if not exists time_entries (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  work_item_id    uuid not null references work_items(id) on delete cascade,
  user_id         uuid not null references auth.users(id),
  duration_minutes integer not null check (duration_minutes > 0),
  description     text,
  logged_date     date not null default current_date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_time_entries_item on time_entries(work_item_id);
create index if not exists idx_time_entries_user on time_entries(user_id, workspace_id);

drop trigger if exists time_entries_updated_at on time_entries;
create trigger time_entries_updated_at
  before update on time_entries
  for each row execute function update_updated_at_column();

create table if not exists notifications (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  type          text not null,
  title         text not null,
  body          text not null default '',
  entity_type   text,
  entity_id     uuid,
  actor_id      uuid references auth.users(id),
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists idx_notifications_user on notifications(user_id, created_at desc);
create index if not exists idx_notifications_unread on notifications(user_id) where read_at is null;

create table if not exists notification_preferences (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  workspace_id    uuid references workspaces(id) on delete cascade,
  event_type      text not null,
  channel_in_app  boolean not null default true,
  channel_email   boolean not null default false,
  channel_push    boolean not null default false,
  unique (user_id, workspace_id, event_type)
);

create table if not exists saved_views (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  project_id    uuid references projects(id) on delete cascade,
  user_id       uuid not null references auth.users(id),
  name          text not null check (length(name) between 1 and 100),
  view_type     text not null check (view_type in ('board', 'list', 'timeline', 'calendar')),
  filters       jsonb not null default '{}'::jsonb,
  sort_by       jsonb not null default '[]'::jsonb,
  is_shared     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_saved_views_user on saved_views(user_id, workspace_id);

drop trigger if exists saved_views_updated_at on saved_views;
create trigger saved_views_updated_at
  before update on saved_views
  for each row execute function update_updated_at_column();

create table if not exists invitations (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  email         text not null,
  role          workspace_role not null default 'member',
  invited_by    uuid not null references auth.users(id),
  token         text not null unique,
  expires_at    timestamptz not null default (now() + interval '7 days'),
  accepted_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists idx_invitations_email on invitations(email);
create index if not exists idx_invitations_token on invitations(token);
create index if not exists idx_invitations_ws on invitations(workspace_id);

create table if not exists audit_log (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null,
  user_id       uuid,
  action        text not null,
  entity_type   text not null,
  entity_id     uuid,
  metadata      jsonb,
  ip_address    inet,
  created_at    timestamptz not null default now()
);

create index if not exists idx_audit_log_ws on audit_log(workspace_id, created_at desc);
create index if not exists idx_audit_log_user on audit_log(user_id, created_at desc);

create table if not exists feature_flags (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  description   text,
  enabled       boolean not null default false,
  owner         text,
  removal_date  date,
  conditions    jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists feature_flags_updated_at on feature_flags;
create trigger feature_flags_updated_at
  before update on feature_flags
  for each row execute function update_updated_at_column();

-- Sequence function
create or replace function next_work_item_sequence(p_project_id uuid)
returns bigint
language plpgsql
as $$
declare
  v_seq bigint;
begin
  update projects
  set item_counter = item_counter + 1
  where id = p_project_id
  returning item_counter into v_seq;
  
  return v_seq;
end;
$$;

-- 21. Enable & Force RLS Across All Work Item Engine Tables
alter table projects enable row level security;
alter table projects force row level security;

drop policy if exists projects_select on projects;
create policy projects_select on projects
  for select using (
    workspace_id in (select auth_workspace_ids())
    and deleted_at is null
    and (
      not exists (
        select 1 from workspace_members m
        where m.workspace_id = projects.workspace_id
          and m.user_id = auth.uid()
          and m.role = 'guest'
      )
      or exists (
        select 1 from project_members p
        where p.project_id = projects.id
          and p.user_id = auth.uid()
      )
    )
  );

drop policy if exists projects_insert on projects;
create policy projects_insert on projects
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
    and created_by = auth.uid()
  );

drop policy if exists projects_update on projects;
create policy projects_update on projects
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists projects_delete on projects;
create policy projects_delete on projects
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
  );

alter table project_members enable row level security;
alter table project_members force row level security;

drop policy if exists project_members_select on project_members;
create policy project_members_select on project_members
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists project_members_insert on project_members;
create policy project_members_insert on project_members
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
  );

drop policy if exists project_members_update on project_members;
create policy project_members_update on project_members
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists project_members_delete on project_members;
create policy project_members_delete on project_members
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
  );

alter table work_item_types enable row level security;
alter table work_item_types force row level security;

drop policy if exists work_item_types_select on work_item_types;
create policy work_item_types_select on work_item_types
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists work_item_types_insert on work_item_types;
create policy work_item_types_insert on work_item_types
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
  );

drop policy if exists work_item_types_update on work_item_types;
create policy work_item_types_update on work_item_types
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists work_item_types_delete on work_item_types;
create policy work_item_types_delete on work_item_types
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
    and is_system = false
  );

alter table labels enable row level security;
alter table labels force row level security;

drop policy if exists labels_select on labels;
create policy labels_select on labels
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists labels_insert on labels;
create policy labels_insert on labels
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  );

drop policy if exists labels_update on labels;
create policy labels_update on labels
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists labels_delete on labels;
create policy labels_delete on labels
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
  );

alter table statuses enable row level security;
alter table statuses force row level security;

drop policy if exists statuses_select on statuses;
create policy statuses_select on statuses
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists statuses_insert on statuses;
create policy statuses_insert on statuses
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
  );

drop policy if exists statuses_update on statuses;
create policy statuses_update on statuses
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists statuses_delete on statuses;
create policy statuses_delete on statuses
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
  );

alter table sprints enable row level security;
alter table sprints force row level security;

drop policy if exists sprints_select on sprints;
create policy sprints_select on sprints
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists sprints_insert on sprints;
create policy sprints_insert on sprints
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
  );

drop policy if exists sprints_update on sprints;
create policy sprints_update on sprints
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists sprints_delete on sprints;
create policy sprints_delete on sprints
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
  );

alter table work_items enable row level security;
alter table work_items force row level security;

drop policy if exists work_items_select on work_items;
create policy work_items_select on work_items
  for select using (
    workspace_id in (select auth_workspace_ids())
    and deleted_at is null
    and (
      not exists (
        select 1 from workspace_members m
        where m.workspace_id = work_items.workspace_id
          and m.user_id = auth.uid()
          and m.role = 'guest'
      )
      or exists (
        select 1 from work_item_assignees a
        where a.work_item_id = work_items.id
          and a.user_id = auth.uid()
      )
    )
  );

drop policy if exists work_items_insert on work_items;
create policy work_items_insert on work_items
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
    and creator_id = auth.uid()
  );

drop policy if exists work_items_update on work_items;
create policy work_items_update on work_items
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists work_items_delete on work_items;
create policy work_items_delete on work_items
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
  );

alter table work_item_assignees enable row level security;
alter table work_item_assignees force row level security;

drop policy if exists wi_assignees_select on work_item_assignees;
create policy wi_assignees_select on work_item_assignees
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists wi_assignees_insert on work_item_assignees;
create policy wi_assignees_insert on work_item_assignees
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  );

drop policy if exists wi_assignees_delete on work_item_assignees;
create policy wi_assignees_delete on work_item_assignees
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  );

alter table work_item_watchers enable row level security;
alter table work_item_watchers force row level security;

drop policy if exists wi_watchers_select on work_item_watchers;
create policy wi_watchers_select on work_item_watchers
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists wi_watchers_insert on work_item_watchers;
create policy wi_watchers_insert on work_item_watchers
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and user_id = auth.uid()
  );

drop policy if exists wi_watchers_delete on work_item_watchers;
create policy wi_watchers_delete on work_item_watchers
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and user_id = auth.uid()
  );

alter table work_item_labels enable row level security;
alter table work_item_labels force row level security;

drop policy if exists wi_labels_select on work_item_labels;
create policy wi_labels_select on work_item_labels
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists wi_labels_insert on work_item_labels;
create policy wi_labels_insert on work_item_labels
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  );

drop policy if exists wi_labels_delete on work_item_labels;
create policy wi_labels_delete on work_item_labels
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  );

alter table work_item_dependencies enable row level security;
alter table work_item_dependencies force row level security;

drop policy if exists wi_deps_select on work_item_dependencies;
create policy wi_deps_select on work_item_dependencies
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists wi_deps_insert on work_item_dependencies;
create policy wi_deps_insert on work_item_dependencies
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  );

drop policy if exists wi_deps_delete on work_item_dependencies;
create policy wi_deps_delete on work_item_dependencies
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  );

alter table custom_field_definitions enable row level security;
alter table custom_field_definitions force row level security;

drop policy if exists cfd_select on custom_field_definitions;
create policy cfd_select on custom_field_definitions
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists cfd_insert on custom_field_definitions;
create policy cfd_insert on custom_field_definitions
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
    and created_by = auth.uid()
  );

drop policy if exists cfd_update on custom_field_definitions;
create policy cfd_update on custom_field_definitions
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists cfd_delete on custom_field_definitions;
create policy cfd_delete on custom_field_definitions
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
  );

alter table custom_field_values enable row level security;
alter table custom_field_values force row level security;

drop policy if exists cfv_select on custom_field_values;
create policy cfv_select on custom_field_values
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists cfv_insert on custom_field_values;
create policy cfv_insert on custom_field_values
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  );

drop policy if exists cfv_update on custom_field_values;
create policy cfv_update on custom_field_values
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists cfv_delete on custom_field_values;
create policy cfv_delete on custom_field_values
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  );

alter table comments enable row level security;
alter table comments force row level security;

drop policy if exists comments_select on comments;
create policy comments_select on comments
  for select using (
    workspace_id in (select auth_workspace_ids())
    and deleted_at is null
  );

drop policy if exists comments_insert on comments;
create policy comments_insert on comments
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
    and author_id = auth.uid()
  );

drop policy if exists comments_update on comments;
create policy comments_update on comments
  for update using (
    workspace_id in (select auth_workspace_ids())
    and author_id = auth.uid()
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists comments_delete on comments;
create policy comments_delete on comments
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and (author_id = auth.uid() or has_workspace_role(workspace_id, 'manager'))
  );

alter table attachments enable row level security;
alter table attachments force row level security;

drop policy if exists attachments_select on attachments;
create policy attachments_select on attachments
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists attachments_insert on attachments;
create policy attachments_insert on attachments
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
    and uploaded_by = auth.uid()
  );

drop policy if exists attachments_delete on attachments;
create policy attachments_delete on attachments
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and (uploaded_by = auth.uid() or has_workspace_role(workspace_id, 'manager'))
  );

alter table activity_events enable row level security;
alter table activity_events force row level security;

drop policy if exists activity_events_select on activity_events;
create policy activity_events_select on activity_events
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists activity_events_insert on activity_events;
create policy activity_events_insert on activity_events
  for insert with check (
    workspace_id in (select auth_workspace_ids())
  );

alter table documents enable row level security;
alter table documents force row level security;

drop policy if exists documents_select on documents;
create policy documents_select on documents
  for select using (
    workspace_id in (select auth_workspace_ids())
    and deleted_at is null
  );

drop policy if exists documents_insert on documents;
create policy documents_insert on documents
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
    and created_by = auth.uid()
  );

drop policy if exists documents_update on documents;
create policy documents_update on documents
  for update using (
    workspace_id in (select auth_workspace_ids())
    and (created_by = auth.uid() or has_workspace_role(workspace_id, 'manager'))
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists documents_delete on documents;
create policy documents_delete on documents
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and (created_by = auth.uid() or has_workspace_role(workspace_id, 'manager'))
  );

alter table goals enable row level security;
alter table goals force row level security;

drop policy if exists goals_select on goals;
create policy goals_select on goals
  for select using (
    workspace_id in (select auth_workspace_ids())
    and deleted_at is null
  );

drop policy if exists goals_insert on goals;
create policy goals_insert on goals
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
    and owner_id = auth.uid()
  );

drop policy if exists goals_update on goals;
create policy goals_update on goals
  for update using (
    workspace_id in (select auth_workspace_ids())
    and (owner_id = auth.uid() or has_workspace_role(workspace_id, 'manager'))
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists goals_delete on goals;
create policy goals_delete on goals
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and (owner_id = auth.uid() or has_workspace_role(workspace_id, 'manager'))
  );

alter table goal_work_items enable row level security;
alter table goal_work_items force row level security;

drop policy if exists gwi_select on goal_work_items;
create policy gwi_select on goal_work_items
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists gwi_insert on goal_work_items;
create policy gwi_insert on goal_work_items
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  );

drop policy if exists gwi_delete on goal_work_items;
create policy gwi_delete on goal_work_items
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'member')
  );

alter table time_entries enable row level security;
alter table time_entries force row level security;

drop policy if exists time_entries_select on time_entries;
create policy time_entries_select on time_entries
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists time_entries_insert on time_entries;
create policy time_entries_insert on time_entries
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and user_id = auth.uid()
  );

drop policy if exists time_entries_update on time_entries;
create policy time_entries_update on time_entries
  for update using (
    workspace_id in (select auth_workspace_ids())
    and user_id = auth.uid()
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists time_entries_delete on time_entries;
create policy time_entries_delete on time_entries
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and (user_id = auth.uid() or has_workspace_role(workspace_id, 'manager'))
  );

alter table notifications enable row level security;
alter table notifications force row level security;

drop policy if exists notifications_select on notifications;
create policy notifications_select on notifications
  for select using (
    workspace_id in (select auth_workspace_ids())
    and user_id = auth.uid()
  );

drop policy if exists notifications_update on notifications;
create policy notifications_update on notifications
  for update using (
    workspace_id in (select auth_workspace_ids())
    and user_id = auth.uid()
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists notifications_delete on notifications;
create policy notifications_delete on notifications
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and user_id = auth.uid()
  );

alter table notification_preferences enable row level security;
alter table notification_preferences force row level security;

drop policy if exists notif_pref_select on notification_preferences;
create policy notif_pref_select on notification_preferences
  for select using (
    user_id = auth.uid()
  );

drop policy if exists notif_pref_insert on notification_preferences;
create policy notif_pref_insert on notification_preferences
  for insert with check (
    user_id = auth.uid()
  );

drop policy if exists notif_pref_update on notification_preferences;
create policy notif_pref_update on notification_preferences
  for update using (
    user_id = auth.uid()
  ) with check (
    user_id = auth.uid()
  );

alter table saved_views enable row level security;
alter table saved_views force row level security;

drop policy if exists saved_views_select on saved_views;
create policy saved_views_select on saved_views
  for select using (
    workspace_id in (select auth_workspace_ids())
    and (user_id = auth.uid() or is_shared = true)
  );

drop policy if exists saved_views_insert on saved_views;
create policy saved_views_insert on saved_views
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and user_id = auth.uid()
  );

drop policy if exists saved_views_update on saved_views;
create policy saved_views_update on saved_views
  for update using (
    workspace_id in (select auth_workspace_ids())
    and user_id = auth.uid()
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists saved_views_delete on saved_views;
create policy saved_views_delete on saved_views
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and user_id = auth.uid()
  );

alter table invitations enable row level security;
alter table invitations force row level security;

drop policy if exists invitations_select on invitations;
create policy invitations_select on invitations
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists invitations_insert on invitations;
create policy invitations_insert on invitations
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
    and invited_by = auth.uid()
  );

drop policy if exists invitations_update on invitations;
create policy invitations_update on invitations
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

drop policy if exists invitations_delete on invitations;
create policy invitations_delete on invitations
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
  );

alter table audit_log enable row level security;
alter table audit_log force row level security;

drop policy if exists audit_log_select on audit_log;
create policy audit_log_select on audit_log
  for select using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
  );

drop policy if exists audit_log_insert on audit_log;
create policy audit_log_insert on audit_log
  for insert with check (
    workspace_id in (select auth_workspace_ids())
  );

alter table feature_flags enable row level security;
alter table feature_flags force row level security;

drop policy if exists feature_flags_select on feature_flags;
create policy feature_flags_select on feature_flags
  for select using (true);
