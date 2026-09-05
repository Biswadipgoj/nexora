-- ============================================================
-- NEXORA Migration 001: Foundation — Tenancy & RLS
-- §11.2: Core schema with row-level multi-tenancy
-- §12: RLS as first-class security boundary
-- 
-- ROLLBACK: Drop all tables, functions, types created here.
-- This is a foundational migration — rollback = full reset.
-- ============================================================

-- ============ HELPER: updated_at trigger ============
-- §11.1: updated_at maintained by trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;


-- ============ ENUM ============
-- §3.6: Roles — Owner, Admin, Manager, Member, Viewer, Guest
create type workspace_role as enum (
  'owner', 'admin', 'manager', 'member', 'viewer', 'guest'
);


-- ============ WORKSPACES ============
-- §10.1: User → Workspace (tenant boundary — ALL isolation enforced here)
-- §10.2: Personal space is a workspace with is_personal = true (ADR-002)
create table workspaces (
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

create trigger workspaces_updated_at
  before update on workspaces
  for each row execute function update_updated_at_column();


-- ============ WORKSPACE MEMBERS ============
-- §3.6: workspace-level membership with role
create table workspace_members (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          workspace_role not null default 'member',
  invited_by    uuid references auth.users(id),
  joined_at     timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- §11.1: Every foreign key is indexed
create index idx_ws_members_user on workspace_members(user_id);
create index idx_ws_members_ws   on workspace_members(workspace_id);


-- ============ TEAMS ============
-- §10.1: Teams belong to a workspace
create table teams (
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

create index idx_teams_ws on teams(workspace_id) where deleted_at is null;

create trigger teams_updated_at
  before update on teams
  for each row execute function update_updated_at_column();


-- ============ TEAM MEMBERS ============
create table team_members (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid not null references teams(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  role          workspace_role not null default 'member',
  unique (team_id, user_id)
);

-- §11.1: Every foreign key is indexed
create index idx_team_members_team on team_members(team_id);
create index idx_team_members_user on team_members(user_id);
create index idx_team_members_ws   on team_members(workspace_id);


-- ============ RLS HELPER FUNCTIONS ============
-- §12.4: Reusable, indexed helpers. SECURITY DEFINER + STABLE
-- so PostgreSQL can cache within a statement.

-- Returns all workspace IDs the current user is a member of
create or replace function auth_workspace_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select workspace_id from workspace_members where user_id = auth.uid();
$$;

-- Checks if the current user has at least the specified role in a workspace
-- §12.3: Roles ordered: owner > admin > manager > member > viewer > guest
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

-- Returns the current user's role in a specific workspace
create or replace function get_workspace_role(ws uuid)
returns workspace_role
language sql stable security definer set search_path = public
as $$
  select role from workspace_members
  where workspace_id = ws and user_id = auth.uid();
$$;


-- ============ RLS: WORKSPACES ============
-- §12.2: RLS enabled on every table containing tenant data. No exceptions.
alter table workspaces enable row level security;
alter table workspaces force row level security;

-- SELECT: users can see workspaces they are members of
create policy workspaces_select on workspaces
  for select using (
    (id in (select auth_workspace_ids()) or owner_id = auth.uid())
    and deleted_at is null
  );

-- INSERT: any authenticated user can create a workspace
create policy workspaces_insert on workspaces
  for insert with check (
    owner_id = auth.uid()
  );

-- UPDATE: only owner or admin can update workspace
-- §12.4: with check clause prevents re-parenting
create policy workspaces_update on workspaces
  for update using (
    id in (select auth_workspace_ids())
    and has_workspace_role(id, 'admin')
  ) with check (
    id in (select auth_workspace_ids())
  );

-- DELETE (soft): only owner can delete
create policy workspaces_delete on workspaces
  for delete using (
    id in (select auth_workspace_ids())
    and has_workspace_role(id, 'owner')
  );


-- ============ RLS: WORKSPACE_MEMBERS ============
alter table workspace_members enable row level security;
alter table workspace_members force row level security;

-- SELECT: members can see other members in their workspace
create policy ws_members_select on workspace_members
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

-- INSERT: admin+ can invite members
create policy ws_members_insert on workspace_members
  for insert with check (
    has_workspace_role(workspace_id, 'admin')
    or (
      -- Allow self-insert for the workspace owner during creation
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

-- UPDATE: admin+ can change roles, but cannot elevate beyond own role
create policy ws_members_update on workspace_members
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

-- DELETE: admin+ can remove members, or user can remove themselves
create policy ws_members_delete on workspace_members
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and (
      has_workspace_role(workspace_id, 'admin')
      or user_id = auth.uid()
    )
  );


-- ============ RLS: TEAMS ============
alter table teams enable row level security;
alter table teams force row level security;

create policy teams_select on teams
  for select using (
    workspace_id in (select auth_workspace_ids())
    and deleted_at is null
  );

create policy teams_insert on teams
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
  );

create policy teams_update on teams
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

create policy teams_delete on teams
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'admin')
  );


-- ============ RLS: TEAM_MEMBERS ============
alter table team_members enable row level security;
alter table team_members force row level security;

create policy team_members_select on team_members
  for select using (
    workspace_id in (select auth_workspace_ids())
  );

create policy team_members_insert on team_members
  for insert with check (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
  );

create policy team_members_update on team_members
  for update using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
  ) with check (
    workspace_id in (select auth_workspace_ids())
  );

create policy team_members_delete on team_members
  for delete using (
    workspace_id in (select auth_workspace_ids())
    and has_workspace_role(workspace_id, 'manager')
  );
