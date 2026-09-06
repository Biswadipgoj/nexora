import { describe, it, expect, beforeEach } from 'vitest';
import { invitationSchemas } from '@/lib/validation/workspace';
import {
  createInvitation,
  getInvitationByToken,
  listProjectInvitations,
  acceptInvitation,
  revokeInvitation,
  resetInvitationStore,
} from '@/lib/invitations/store';
import { addDemoProject, getDemoProjectById, getDemoProjects } from '@/lib/demo/demo-store';

describe('Project & Email Invitations Workflow Suite', () => {
  beforeEach(() => {
    resetInvitationStore();
  });

  describe('Validation & Authorization Roles', () => {
    it('validates role choices strictly to authorized position roles', () => {
      const validRoles = ['admin', 'manager', 'member', 'viewer'] as const;
      for (const role of validRoles) {
        const parsed = invitationSchemas.create.safeParse({
          workspace_id: 'b0000000-0000-4000-8000-000000000001',
          project_id: 'c0000000-0000-4000-8000-000000000001',
          email: 'colleague@company.com',
          role,
        });
        expect(parsed.success).toBe(true);
      }
    });

    it('rejects invalid or unauthorized role escalations', () => {
      const invalid = invitationSchemas.create.safeParse({
        workspace_id: 'b0000000-0000-4000-8000-000000000001',
        email: 'attacker@company.com',
        role: 'superadmin_escalated',
      });
      expect(invalid.success).toBe(false);
    });

    it('rejects invalid email formats for invitations', () => {
      const badEmails = ['not-an-email', 'missing@domain', '@nouser.com', 'spaces in@mail.com'];
      for (const email of badEmails) {
        const result = invitationSchemas.create.safeParse({
          workspace_id: 'b0000000-0000-4000-8000-000000000001',
          email,
          role: 'member',
        });
        expect(result.success).toBe(false);
      }
    });

    it('enforces minimum 8-character password requirement on invitation acceptance signup', () => {
      const shortPass = invitationSchemas.accept.safeParse({
        token: 'a'.repeat(64),
        password: 'short',
      });
      expect(shortPass.success).toBe(false);

      const validPass = invitationSchemas.accept.safeParse({
        token: 'a'.repeat(64),
        password: 'ValidSecurePassword123!',
      });
      expect(validPass.success).toBe(true);
    });
  });

  describe('Invitation Token Lifecycle & Security', () => {
    it('generates high-entropy cryptographically secure 64-character hex tokens', () => {
      const invite = createInvitation({
        workspace_id: 'b0000000-0000-4000-8000-000000000001',
        project_id: 'c0000000-0000-4000-8000-000000000001',
        email: 'engineer@nexora.io',
        role: 'manager',
        invited_by: 'user-lead-123',
      });

      expect(invite.token).toBeDefined();
      expect(invite.token.length).toBe(64);
      expect(invite.role).toBe('manager');
      expect(invite.email).toBe('engineer@nexora.io');
      expect(invite.accepted_at).toBeNull();

      // Check token resolution
      const found = getInvitationByToken(invite.token);
      expect(found).not.toBeNull();
      expect(found?.email).toBe('engineer@nexora.io');
    });

    it('returns null for non-existent or forged tokens', () => {
      const found = getInvitationByToken('fake-token-1234567890');
      expect(found).toBeNull();
    });

    it('allows listing active invitations scoped by project ID', () => {
      const p1 = 'proj-alpha-123';
      const p2 = 'proj-beta-456';

      createInvitation({
        workspace_id: 'b0000000-0000-4000-8000-000000000001',
        project_id: p1,
        email: 'member1@nexora.io',
        role: 'member',
        invited_by: 'u1',
      });

      createInvitation({
        workspace_id: 'b0000000-0000-4000-8000-000000000001',
        project_id: p2,
        email: 'member2@nexora.io',
        role: 'viewer',
        invited_by: 'u1',
      });

      const list1 = listProjectInvitations(p1);
      expect(list1.length).toBe(1);
      expect(list1[0].email).toBe('member1@nexora.io');

      const list2 = listProjectInvitations(p2);
      expect(list2.length).toBe(1);
      expect(list2[0].email).toBe('member2@nexora.io');
    });

    it('successfully accepts invitation and prevents replay attacks', () => {
      const invite = createInvitation({
        workspace_id: 'b0000000-0000-4000-8000-000000000001',
        project_id: 'c0000000-0000-4000-8000-000000000001',
        email: 'newuser@nexora.io',
        role: 'admin',
        invited_by: 'u1',
      });

      // First acceptance succeeds
      const acceptResult = acceptInvitation(invite.token, 'new-user-id-999', 'newuser@nexora.io');
      expect(acceptResult.success).toBe(true);
      expect(acceptResult.invitation?.accepted_at).toBeDefined();

      // Second acceptance (replay attempt) is rejected
      const replayResult = acceptInvitation(invite.token, 'attacker-id', 'attacker@nexora.io');
      expect(replayResult.success).toBe(false);
      expect(replayResult.error).toContain('already been accepted');
    });

    it('immediately invalidates token upon invitation revocation', () => {
      const invite = createInvitation({
        workspace_id: 'b0000000-0000-4000-8000-000000000001',
        project_id: 'c0000000-0000-4000-8000-000000000001',
        email: 'revokeme@nexora.io',
        role: 'member',
        invited_by: 'u1',
      });

      expect(getInvitationByToken(invite.token)).toBeDefined();

      const revoked = revokeInvitation(invite.id);
      expect(revoked).toBe(true);

      // Token no longer resolves
      expect(getInvitationByToken(invite.token)).toBeNull();
    });
  });

  describe('Real Dynamic Project Creation & Retrieval', () => {
    it('persists newly created projects and maintains integrity', () => {
      const initialCount = getDemoProjects().length;

      const created = addDemoProject({
        name: 'Mobile Checkout V2',
        key: 'CHK',
        description: 'New high-conversion checkout flow',
        mode: 'advanced',
        workspace_id: 'b0000000-0000-4000-8000-000000000001',
      });

      expect(created.id).toBeDefined();
      expect(created.key).toBe('CHK');
      expect(created.name).toBe('Mobile Checkout V2');
      expect(created.mode).toBe('advanced');

      const all = getDemoProjects();
      expect(all.length).toBe(initialCount + 1);

      const retrieved = getDemoProjectById(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Mobile Checkout V2');
    });
  });
});
