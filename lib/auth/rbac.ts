/**
 * Role-Based Access Control (RBAC) & Authorization Resolution.
 * §12.3: Effective-permission model:
 * Roles are strictly ordered: owner > admin > manager > member > viewer > guest.
 * 
 * Resolution order for a resource:
 * 1. Explicit project-level override for this user, if present.
 * 2. Project membership role.
 * 3. Team membership role (if the project belongs to a team).
 * 4. Workspace membership role.
 * 5. Deny.
 * 
 * Guests resolve ONLY at step 1 or 2 — a guest NEVER inherits workspace-level access (§12.3).
 */

import type { WorkspaceRole } from '@/lib/db/types';

export const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  guest: 0,
  viewer: 1,
  member: 2,
  manager: 3,
  admin: 4,
  owner: 5,
};

/**
 * Checks if a given role meets or exceeds a minimum required role.
 */
export function hasRequiredRole(role: WorkspaceRole, minRequiredRole: WorkspaceRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minRequiredRole];
}

export interface PermissionContext {
  workspaceRole?: WorkspaceRole | null;
  teamRole?: WorkspaceRole | null;
  projectRole?: WorkspaceRole | null;
  isGuest?: boolean;
}

/**
 * Resolves effective role for a user accessing a project resource per §12.3.
 */
export function resolveEffectiveRole(context: PermissionContext): WorkspaceRole | null {
  // If user has a project-level role, that takes precedence
  if (context.projectRole) {
    return context.projectRole;
  }

  // Guests resolve ONLY at project level. If no project role, deny immediately.
  if (context.isGuest || context.workspaceRole === 'guest') {
    return null;
  }

  // Next fallback: team membership role
  if (context.teamRole) {
    return context.teamRole;
  }

  // Next fallback: workspace membership role
  if (context.workspaceRole) {
    return context.workspaceRole;
  }

  // Otherwise Deny
  return null;
}

export type ResourceAction =
  | 'view_project'
  | 'create_work_item'
  | 'update_work_item'
  | 'delete_work_item'
  | 'manage_project'
  | 'manage_team'
  | 'manage_workspace'
  | 'delete_workspace';

const ACTION_MIN_ROLES: Record<ResourceAction, WorkspaceRole> = {
  view_project: 'guest',
  create_work_item: 'member',
  update_work_item: 'member',
  delete_work_item: 'manager',
  manage_project: 'manager',
  manage_team: 'admin',
  manage_workspace: 'admin',
  delete_workspace: 'owner',
};

/**
 * Evaluates whether an effective role is authorized to perform an action.
 */
export function isActionPermitted(role: WorkspaceRole | null, action: ResourceAction): boolean {
  if (!role) return false;
  const minRole = ACTION_MIN_ROLES[action];
  return hasRequiredRole(role, minRole);
}

/**
 * Verifies cross-tenant isolation and blocks manipulation.
 * §12.2: Client-supplied workspace_id is never trusted blindly.
 */
export function assertWorkspaceMatch(
  requestWorkspaceId: string,
  userAuthorizedWorkspaceIds: string[]
): boolean {
  return userAuthorizedWorkspaceIds.includes(requestWorkspaceId);
}
