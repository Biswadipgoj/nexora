/**
 * Project and Workspace Invitations Engine
 * Handles invitation generation, cryptographic tokens, role/position authorization,
 * and project membership activation across Supabase and runtime memory.
 */

import crypto from 'crypto';
import { DEMO_PROJECT, DEMO_WORKSPACE } from '@/lib/demo/demo-store';

export type WorkspaceRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer' | 'guest';

export interface ProjectInvitation {
  id: string;
  workspace_id: string;
  project_id: string;
  project_name: string;
  project_key: string;
  email: string;
  role: WorkspaceRole;
  invited_by: string;
  invited_by_name?: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

// In-memory persistent cache for invitations across dev and demo sessions
let invitationsStore: ProjectInvitation[] = [
  {
    id: 'inv-sample-001',
    workspace_id: DEMO_WORKSPACE.id,
    project_id: DEMO_PROJECT.id,
    project_name: DEMO_PROJECT.name,
    project_key: DEMO_PROJECT.key,
    email: 'sarah.lead@company.com',
    role: 'manager',
    invited_by: 'a0000000-0000-4000-8000-000000000001',
    invited_by_name: 'Alex Morgan',
    token: 'nexora_inv_demo_pm_7729',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    accepted_at: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export interface CreateInviteParams {
  workspace_id: string;
  project_id?: string;
  project_name?: string;
  project_key?: string;
  email: string;
  role: WorkspaceRole;
  invited_by: string;
  invited_by_name?: string;
}

export function createInvitation(params: CreateInviteParams): ProjectInvitation {
  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const newInvitation: ProjectInvitation = {
    id: crypto.randomUUID(),
    workspace_id: params.workspace_id,
    project_id: params.project_id || DEMO_PROJECT.id,
    project_name: params.project_name || DEMO_PROJECT.name,
    project_key: params.project_key || DEMO_PROJECT.key,
    email: params.email.trim().toLowerCase(),
    role: params.role,
    invited_by: params.invited_by,
    invited_by_name: params.invited_by_name || 'Team Lead',
    token,
    expires_at: expiresAt,
    accepted_at: null,
    created_at: new Date().toISOString(),
  };

  // Remove any previous pending invite for the same email and project
  invitationsStore = invitationsStore.filter(
    (inv) => !(inv.project_id === newInvitation.project_id && inv.email === newInvitation.email && !inv.accepted_at)
  );

  invitationsStore.unshift(newInvitation);
  return newInvitation;
}

export function getInvitationByToken(token: string): ProjectInvitation | null {
  const invite = invitationsStore.find((inv) => inv.token === token);
  if (!invite) return null;

  // Check expiration
  const isExpired = new Date(invite.expires_at).getTime() < Date.now();
  if (isExpired) return null;

  return invite;
}

export function listProjectInvitations(projectId: string): ProjectInvitation[] {
  return invitationsStore.filter((inv) => inv.project_id === projectId);
}

export interface AcceptInviteResult {
  success: boolean;
  error?: string;
  invitation?: ProjectInvitation;
}

export function acceptInvitation(token: string, userId: string, userEmail?: string): AcceptInviteResult {
  const invite = getInvitationByToken(token);
  if (!invite) {
    return { success: false, error: 'Invitation link is invalid or has expired.' };
  }

  if (invite.accepted_at) {
    return { success: false, error: 'This invitation has already been accepted.' };
  }

  // If email is provided, verify it matches
  if (userEmail && userEmail.toLowerCase() !== invite.email.toLowerCase()) {
    return {
      success: false,
      error: `This invitation was issued to ${invite.email}. Please sign in with that email address.`,
    };
  }

  invite.accepted_at = new Date().toISOString();
  return { success: true, invitation: invite };
}

export function revokeInvitation(identifier: string): boolean {
  const index = invitationsStore.findIndex((inv) => inv.token === identifier || inv.id === identifier);
  if (index === -1) return false;
  invitationsStore.splice(index, 1);
  return true;
}

export function resetInvitationsStore(): void {
  invitationsStore = [];
}

export const resetInvitationStore = resetInvitationsStore;
