import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isDemoRequest } from '@/lib/supabase/config';
import { invitationSchemas } from '@/lib/validation/workspace';
import {
  createInvitation,
  findInvitation,
  getInvitationByToken,
  listProjectInvitations,
  revokeInvitation,
  type ProjectInvitation,
} from '@/lib/invitations/store';
import { getProjectAccess } from '@/lib/invitations/access';
import { hasRequiredRole, isActionPermitted } from '@/lib/auth/rbac';
import { getDemoProjectById, DEMO_USER } from '@/lib/demo/demo-store';
import { UUID_REGEX } from '@/lib/db/reference-ids';
import { logger } from '@/lib/logger';
import type { WorkspaceRole } from '@/lib/db/types';

/** What an invitee may see before accepting: no token, no inviter id. */
function publicView(invite: ProjectInvitation) {
  return {
    id: invite.id,
    email: invite.email,
    role: invite.role,
    workspace_id: invite.workspace_id,
    project_id: invite.project_id,
    project_name: invite.project_name,
    project_key: invite.project_key,
    invited_by_name: invite.invited_by_name,
    expires_at: invite.expires_at,
    accepted_at: invite.accepted_at,
  };
}

type ServerClient = Awaited<ReturnType<typeof createServerClient>>;

interface ProjectSummary {
  name: string;
  key: string;
  workspace_id: string;
}

type ManagerAuth =
  | { ok: true; demo: true; userId: string; userName: string; project: ProjectSummary }
  | {
      ok: true;
      demo: false;
      userId: string;
      userName: string;
      supabase: ServerClient;
      role: WorkspaceRole | null;
      project: ProjectSummary;
    }
  | { ok: false; response: NextResponse };

/**
 * Who is asking, and may they manage invitations for this project?
 *
 * Previously any signed-in user could list the pending invitations — tokens
 * included — for any project id, issue invitations to projects they could not
 * see, and invite someone at a higher role than their own.
 */
async function authorizeManager(request: NextRequest, projectId: string): Promise<ManagerAuth> {
  if (isDemoRequest(request.cookies)) {
    const project = getDemoProjectById(projectId);
    if (!project) {
      return { ok: false, response: NextResponse.json({ error: 'Project not found.' }, { status: 404 }) };
    }
    return {
      ok: true,
      demo: true,
      userId: DEMO_USER.id,
      userName: DEMO_USER.user_metadata.full_name,
      project,
    };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (!UUID_REGEX.test(projectId)) {
    return { ok: false, response: NextResponse.json({ error: 'Project not found.' }, { status: 404 }) };
  }

  const access = await getProjectAccess(supabase, projectId, user.id);
  if (!access) {
    return { ok: false, response: NextResponse.json({ error: 'Project not found.' }, { status: 404 }) };
  }
  if (!isActionPermitted(access.role, 'manage_project')) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Only project managers can manage invitations.' }, { status: 403 }),
    };
  }

  return {
    ok: true,
    demo: false,
    userId: user.id,
    userName: (user.user_metadata?.full_name as string | undefined) || user.email?.split('@')[0] || 'A teammate',
    supabase,
    role: access.role,
    project: access.project,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get('token');
  const projectId = searchParams.get('projectId');

  // Public resolution of an invite token for the invitation page.
  if (token) {
    const invitation = getInvitationByToken(token);
    if (!invitation) {
      return NextResponse.json({ error: 'This invitation link is invalid or has expired.' }, { status: 404 });
    }
    return NextResponse.json({ invitation: publicView(invitation) });
  }

  if (projectId) {
    const auth = await authorizeManager(request, projectId);
    if (!auth.ok) return auth.response;
    const invitations = listProjectInvitations(projectId).filter((inv) => !inv.accepted_at);
    return NextResponse.json({ invitations });
  }

  return NextResponse.json({ error: 'token or projectId parameter is required' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = invitationSchemas.create.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid invitation.' }, { status: 400 });
  }

  const validated = parsed.data;
  if (!validated.project_id) {
    return NextResponse.json({ error: 'project_id is required.' }, { status: 400 });
  }

  const auth = await authorizeManager(request, validated.project_id);
  if (!auth.ok) return auth.response;

  // Nobody can hand out more access than they hold.
  if (!auth.demo && (!auth.role || !hasRequiredRole(auth.role, validated.role))) {
    return NextResponse.json({ error: 'You cannot invite someone at a higher role than your own.' }, { status: 403 });
  }

  const invitation = createInvitation({
    workspace_id: auth.project.workspace_id,
    project_id: validated.project_id,
    project_name: auth.project.name,
    project_key: auth.project.key,
    email: validated.email,
    role: validated.role,
    invited_by: auth.userId,
    invited_by_name: auth.userName,
  });

  if (!auth.demo) {
    const { error } = await auth.supabase.from('invitations').insert({
      workspace_id: auth.project.workspace_id,
      email: invitation.email,
      role: invitation.role,
      invited_by: auth.userId,
      token: invitation.token,
      expires_at: invitation.expires_at,
    });
    if (error) logger.warn('Invitation row not persisted', { error: error.message });
  }

  logger.info('Project invitation created', {
    role: validated.role,
    project_id: validated.project_id,
    user_id: auth.userId,
  });

  return NextResponse.json({
    success: true,
    invitation,
    inviteUrl: `${request.nextUrl.origin}/invite/${invitation.token}`,
  });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  // The share dialog revokes by id; older callers passed the token. Both work —
  // accepting only `token` meant the dialog's revoke button never did anything.
  const identifier = searchParams.get('id') || searchParams.get('token');

  if (!identifier) {
    return NextResponse.json({ error: 'id or token parameter is required' }, { status: 400 });
  }

  const invite = findInvitation(identifier);
  if (!invite) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  }

  const auth = await authorizeManager(request, invite.project_id);
  if (!auth.ok) return auth.response;

  revokeInvitation(invite.id);
  return NextResponse.json({ success: true });
}
