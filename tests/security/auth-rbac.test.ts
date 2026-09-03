import { describe, it, expect } from 'vitest';
import {
  ROLE_HIERARCHY,
  hasRequiredRole,
  resolveEffectiveRole,
  isActionPermitted,
  assertWorkspaceMatch,
} from '@/lib/auth/rbac';
import { workspaceSchemas, workItemSchemas } from '@/lib/validation/workspace';

/**
 * Security Test Suite: S1, S2, S3, S5 (§15)
 */

describe('S1 — Cross-Workspace Isolation', () => {
  const userA_Workspaces = ['workspace-a-uuid-1111', 'workspace-a-uuid-2222'];
  const userB_Workspace = 'workspace-b-uuid-9999';

  it('rejects requests targeting a workspace outside the user authorized workspace set', () => {
    // Attempting to access Workspace B as User A
    const allowed = assertWorkspaceMatch(userB_Workspace, userA_Workspaces);
    expect(allowed).toBe(false);
  });

  it('accepts requests targeting workspaces the user is a member of', () => {
    const allowed = assertWorkspaceMatch('workspace-a-uuid-1111', userA_Workspaces);
    expect(allowed).toBe(true);
  });
});

describe('S2 — IDOR Resistance & UUID Validation', () => {
  it('rejects sequential integer IDs and validates UUID formats strictly', () => {
    const invalidPayload = {
      workspace_id: '123', // sequential int or invalid uuid
      project_id: '456',
      type_id: '789',
      status_id: '012',
      title: 'Test IDOR Item',
    };

    const result = workItemSchemas.create.safeParse(invalidPayload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.workspace_id).toBeDefined();
      expect(fieldErrors.project_id).toBeDefined();
    }
  });

  it('accepts cryptographically random UUIDv4 identifiers', () => {
    const validPayload = {
      workspace_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      project_id: 'a8098c1a-f86e-11da-bd1a-00112444be1e',
      type_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      status_id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
      title: 'Valid Work Item',
    };

    const result = workItemSchemas.create.safeParse(validPayload);
    expect(result.success).toBe(true);
  });
});

describe('S3 — Role Escalation Rejection & RBAC Hierarchy (§12.3)', () => {
  it('strictly enforces role hierarchy: owner > admin > manager > member > viewer > guest', () => {
    expect(ROLE_HIERARCHY.owner).toBeGreaterThan(ROLE_HIERARCHY.admin);
    expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.manager);
    expect(ROLE_HIERARCHY.manager).toBeGreaterThan(ROLE_HIERARCHY.member);
    expect(ROLE_HIERARCHY.member).toBeGreaterThan(ROLE_HIERARCHY.viewer);
    expect(ROLE_HIERARCHY.viewer).toBeGreaterThan(ROLE_HIERARCHY.guest);
  });

  it('prevents member from deleting workspace (requires owner)', () => {
    const permitted = isActionPermitted('member', 'delete_workspace');
    expect(permitted).toBe(false);
  });

  it('prevents viewer from creating work items (requires member+)', () => {
    const permitted = isActionPermitted('viewer', 'create_work_item');
    expect(permitted).toBe(false);
  });

  it('prevents member from deleting work items (requires manager+)', () => {
    const permitted = isActionPermitted('member', 'delete_work_item');
    expect(permitted).toBe(false);
  });

  it('allows manager and admin to delete work items', () => {
    expect(isActionPermitted('manager', 'delete_work_item')).toBe(true);
    expect(isActionPermitted('admin', 'delete_work_item')).toBe(true);
    expect(isActionPermitted('owner', 'delete_work_item')).toBe(true);
  });

  it('guest role resolves ONLY at project level, never inherits workspace access (§12.3)', () => {
    // Guest with NO explicit project membership
    const effectiveRole = resolveEffectiveRole({
      workspaceRole: 'guest',
      projectRole: null,
      teamRole: null,
      isGuest: true,
    });
    expect(effectiveRole).toBeNull();

    // Guest WITH explicit project membership
    const effectiveWithProject = resolveEffectiveRole({
      workspaceRole: 'guest',
      projectRole: 'viewer',
      teamRole: null,
      isGuest: true,
    });
    expect(effectiveWithProject).toBe('viewer');
  });

  it('project override takes precedence over workspace role', () => {
    const effectiveRole = resolveEffectiveRole({
      workspaceRole: 'member',
      projectRole: 'manager', // explicit project override
    });
    expect(effectiveRole).toBe('manager');
  });
});

describe('S5 — Auth Bypass & Input Validation (§13.5)', () => {
  it('blocks workspace creation with empty or invalid payload', () => {
    const invalidResult = workspaceSchemas.create.safeParse({
      name: '',
      slug: 'INVALID SLUG WITH SPACES',
    });
    expect(invalidResult.success).toBe(false);
  });

  it('blocks unauthenticated action when role is null', () => {
    const permitted = isActionPermitted(null, 'view_project');
    expect(permitted).toBe(false);
  });
});
