-- ============================================================
-- NEXORA Migration 002: Work Item Engine
-- §11.2: The core work item engine with all supporting tables
-- §7.2: Workspace-scoped, reuse-first custom fields (ADR-004)
-- §7.3: Status as ordered list per project
--
-- ROLLBACK: Drop all tables created in this migration in reverse order.
-- ============================================================

-- ============ PROJECTS ============
-- §10.1: Projects belong to a workspace, optionally to a team
create table projects (
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

create index idx_projects_ws on projects(workspace_id) where deleted_at is null;
create index idx_projects_team on projects(team_id) where team_id is not null;

create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at_column();


-- ============ PROJECT MEMBERS ============
create table project_members (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  role          workspace_role not null default 'member',
  unique (project_id, user_id)
);

create index idx_project_members_user on project_members(user_id);
create index idx_project_members_project on project_members(project_id);
create index idx_project_members_ws on project_members(workspace_id);


-- ============ WORK ITEM TYPES ============
-- §7.2: Workspace-scoped, reused across projects (ADR-004)
create table work_item_types (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  name          text not null check (length(name) between 1 and 50),
  icon          text,
  color         text,
  is_system     boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (workspace_id, name)
);

create index idx_work_item_types_ws on work_item_types(workspace_id);


-- ============ LABELS ============
-- §10.1: Labels are workspace-level
create table labels (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  name          text not null check (length(name) between 1 and 50),
  color         text not null default '#6B7280',
  created_at    timestamptz not null default now(),
  unique (workspace_id, lower(name))
);

create index idx_labels_ws on labels(workspace_id);


-- ============ STATUSES ============
-- §7.3: Ordered status list per project (Simple Mode)
create table statuses (
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

create index idx_statuses_project on statuses(project_id);


-- ============ SPRINTS ============
-- Advanced Mode only (§43 should-have, but table needed for FK)
create table sprints (
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

create index idx_sprints_project on sprints(project_id);

create trigger sprints_updated_at
  before update on sprints
  for each row execute function update_updated_at_column();


-- ============ WORK ITEMS ============
-- §3.2: The core generic work-item entity
create table work_items (
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

-- §11.2: Indexes designed around REAL access patterns
create index idx_wi_board       on work_items(project_id, status_id, position) where deleted_at is null;
create index idx_wi_workspace   on work_items(workspace_id, updated_at desc)  where deleted_at is null;
create index idx_wi_parent      on work_items(parent_id)  where parent_id is not null;
create index idx_wi_due         on work_items(workspace_id, due_date) where due_date is not null and deleted_at is null;
create index idx_wi_creator     on work_items(creator_id) where deleted_at is null;
create index idx_wi_sprint      on work_items(sprint_id)  where sprint_id is not null and deleted_at is null;
create index idx_wi_type        on work_items(type_id);

-- §26: Full-text search GIN index
create index idx_wi_search on work_items using gin (
  to_tsvector('english', title || ' ' || coalesce(description->>'text', ''))
);

create trigger work_items_updated_at
  before update on work_items
  for each row execute function update_updated_at_column();


-- ============ WORK ITEM ASSIGNEES ============
-- §3.2: Multiple assignees via junction table
create table work_item_assignees (
  work_item_id  uuid not null references work_items(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  assigned_at   timestamptz not null default now(),
  primary key (work_item_id, user_id)
);

-- Powers "My Tasks" and "My Day" — the single hottest query
create index idx_wi_assignee_user on work_item_assignees(user_id, workspace_id);


-- ============ WORK ITEM WATCHERS ============
create table work_item_watchers (
  work_item_id  uuid not null references work_items(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  primary key (work_item_id, user_id)
);

create index idx_wi_watchers_user on work_item_watchers(user_id, workspace_id);


-- ============ WORK ITEM LABELS ============
create table work_item_labels (
  work_item_id  uuid not null references work_items(id) on delete cascade,
  label_id      uuid not null references labels(id) on delete cascade,
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  primary key (work_item_id, label_id)
);


-- ============ WORK ITEM DEPENDENCIES ============
create table work_item_dependencies (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references workspaces(id) on delete cascade,
  from_item_id   uuid not null references work_items(id) on delete cascade,
  to_item_id     uuid not null references work_items(id) on delete cascade,
  type           text not null check (type in ('blocks', 'relates_to', 'duplicates')),
  unique (from_item_id, to_item_id, type),
  check (from_item_id <> to_item_id)
);


-- ============ CUSTOM FIELDS ============
-- §7.2: Workspace-scoped, reuse-first (ADR-004)
create table custom_field_definitions (
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

create index idx_cfd_ws on custom_field_definitions(workspace_id);

create table custom_field_values (
  work_item_id  uuid not null references work_items(id) on delete cascade,
  field_id      uuid not null references custom_field_definitions(id) on delete cascade,
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  value         jsonb,
  primary key (work_item_id, field_id)
);

create index idx_cfv_field on custom_field_values(field_id);


-- ============ COMMENTS ============
create table comments (
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

create index idx_comments_item on comments(work_item_id, created_at) where deleted_at is null;

create trigger comments_updated_at
  before update on comments
  for each row execute function update_updated_at_column();


-- ============ ATTACHMENTS ============
-- §12.5: Files stored under workspace_id/project_id/uuid-filename
create table attachments (
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

create index idx_attachments_item on attachments(work_item_id);
create index idx_attachments_ws on attachments(workspace_id);


-- ============ ACTIVITY EVENTS ============
-- §11.2: Partitioned by range (monthly)
-- Note: Partitioning on created_at for §18.3 data lifecycle
create table activity_events (
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

-- Create initial partition for current period
create table activity_events_default partition of activity_events default;

create index idx_activity_entity on activity_events(entity_id, created_at desc);
create index idx_activity_ws on activity_events(workspace_id, created_at desc);


-- ============ DOCUMENTS ============
-- §27: Lightweight rich-text documents
create table documents (
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

create index idx_documents_project on documents(project_id) where deleted_at is null;
create index idx_documents_ws on documents(workspace_id) where deleted_at is null;

create trigger documents_updated_at
  before update on documents
  for each row execute function update_updated_at_column();


-- ============ GOALS ============
-- §28: Personal, team, and project goals
create table goals (
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

create index idx_goals_ws on goals(workspace_id) where deleted_at is null;
create index idx_goals_owner on goals(owner_id) where deleted_at is null;

create trigger goals_updated_at
  before update on goals
  for each row execute function update_updated_at_column();

-- Goal-WorkItem junction
create table goal_work_items (
  goal_id       uuid not null references goals(id) on delete cascade,
  work_item_id  uuid not null references work_items(id) on delete cascade,
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  primary key (goal_id, work_item_id)
);


-- ============ TIME ENTRIES ============
-- §29: Native time tracking
create table time_entries (
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

create index idx_time_entries_item on time_entries(work_item_id);
create index idx_time_entries_user on time_entries(user_id, workspace_id);

create trigger time_entries_updated_at
  before update on time_entries
  for each row execute function update_updated_at_column();


-- ============ NOTIFICATIONS ============
-- §24: Notification architecture
create table notifications (
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

create index idx_notifications_user on notifications(user_id, created_at desc);
create index idx_notifications_unread on notifications(user_id) where read_at is null;


-- ============ NOTIFICATION PREFERENCES ============
create table notification_preferences (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  workspace_id    uuid references workspaces(id) on delete cascade,
  event_type      text not null,
  channel_in_app  boolean not null default true,
  channel_email   boolean not null default false,
  channel_push    boolean not null default false,
  unique (user_id, workspace_id, event_type)
);


-- ============ SAVED VIEWS ============
create table saved_views (
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

create index idx_saved_views_user on saved_views(user_id, workspace_id);

create trigger saved_views_updated_at
  before update on saved_views
  for each row execute function update_updated_at_column();


-- ============ INVITATIONS ============
create table invitations (
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

create index idx_invitations_email on invitations(email);
create index idx_invitations_token on invitations(token);
create index idx_invitations_ws on invitations(workspace_id);


-- ============ AUDIT LOG ============
-- §21: Append-only. Never mutated. Never deleted before retention period.
create table audit_log (
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

create index idx_audit_log_ws on audit_log(workspace_id, created_at desc);
create index idx_audit_log_user on audit_log(user_id, created_at desc);


-- ============ FEATURE FLAGS ============
-- §39: Feature flags for gradual rollout and emergency disablement
create table feature_flags (
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

create trigger feature_flags_updated_at
  before update on feature_flags
  for each row execute function update_updated_at_column();


-- ============ SEQUENCE GENERATION FUNCTION ============
-- Thread-safe sequence for human-readable work item IDs (e.g., NEX-42)
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
