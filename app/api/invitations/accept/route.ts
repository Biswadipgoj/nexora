import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient, isAdminConfigured } from '@/lib/supabase/server';
import {
  DEMO_COOKIE_MAX_AGE,
  DEMO_COOKIE_NAME,
  DEMO_COOKIE_OPTIONS,
  isDemoRequest,
} from '@/lib/supabase/config';
import { invitationSchemas } from '@/lib/validation/workspace';
import { acceptInvitation, getInvitationByToken } from '@/lib/invitations/store';
import { DEMO_USER, getDemoProjectById } from '@/lib/demo/demo-store';
import type { WorkspaceRole } from '@/lib/db/types';
import { logger } from '@/lib/logger';

/**
 * Accepting an invitation.
 *
 * Fixed here:
 * - An anonymous request with no password was "accepted" for a made-up user id
 *   (`u_1234abcd`), burning the invitation and reporting success.
 * - When account creation failed for lack of a service-role key, the same fake
 *   id was used and the response still said "Welcome!".
 * - Memberships were written with the invitee's own client, which RLS forbids
 *   (only managers may add members), and the error was swallowed.
 */

/** Workspace access implied by a project invitation — never more than member. */
function workspaceRoleFor(projectRole: WorkspaceRole): WorkspaceRole {
  return projectRole === 'viewer' || projectRole === 'guest' ? 'viewer' : 'member';
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = invitationSchemas.accept.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 });
  }
  const validated = parsed.data;

  const invite = getInvitationByToken(validated.token);
  if (!invite) {
    return NextResponse.json({ error: 'This invitation link is invalid or has expired.' }, { status: 404 });
  }
  if (invite.accepted_at) {
    return NextResponse.json({ error: 'This invitation has already been accepted.' }, { status: 409 });
  }

  // Demo deployments: joining means opening the sample workspace.
  if (isDemoRequest(request.cookies)) {
    const result = acceptInvitation(validated.token, DEMO_USER.id, invite.email);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });

    const response = NextResponse.json({
      success: true,
      projectId: invite.project_id,
      role: invite.role,
      redirectUrl: getDemoProjectById(invite.project_id) ? `/projects/${invite.project_id}` : '/dashboard',
    });
    response.cookies.set({ name: DEMO_COOKIE_NAME, value: 'true', maxAge: DEMO_COOKIE_MAX_AGE, ...DEMO_COOKIE_OPTIONS });
    return response;
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userId = user?.id ?? null;
  let userEmail = user?.email ?? null;
  let createdAccount = false;

  if (!userId) {
    if (!validated.password) {
      return NextResponse.json(
        { error: 'Sign in, or choose a password to create your account.', needsAuth: true },
        { status: 401 }
      );
    }

    if (!isAdminConfigured()) {
      return NextResponse.json(
        {
          error: `Create an account for ${invite.email} first, then open this invitation again.`,
          needsAuth: true,
        },
        { status: 503 }
      );
    }

    const admin = createAdminClient();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: invite.email,
      password: validated.password,
      email_confirm: true,
      user_metadata: { full_name: validated.full_name || invite.email.split('@')[0] },
    });

    if (createError || !created?.user) {
      const exists = /already|registered|exists/i.test(createError?.message ?? '');
      return NextResponse.json(
        exists
          ? { error: 'An account with this email already exists. Sign in to accept the invitation.', needsSignIn: true }
          : { error: 'Could not create your account. Try again.' },
        { status: exists ? 409 : 500 }
      );
    }

    userId = created.user.id;
    userEmail = created.user.email ?? invite.email;
    createdAccount = true;
  }

  if (!userEmail || userEmail.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      { error: `This invitation was sent to ${invite.email}. Sign in with that address to accept it.` },
      { status: 403 }
    );
  }

  // The invitation token is the authorization here, so the membership rows are
  // written with the service role when available. Without it, the insert only
  // succeeds if RLS already allows the user to write them.
  const writer = isAdminConfigured() ? createAdminClient() : supabase;

  const { error: wsError } = await writer.from('workspace_members').upsert(
    { workspace_id: invite.workspace_id, user_id: userId, role: workspaceRoleFor(invite.role) },
    { onConflict: 'workspace_id,user_id', ignoreDuplicates: true }
  );

  const { error: projectError } = await writer.from('project_members').upsert(
    {
      project_id: invite.project_id,
      user_id: userId,
      workspace_id: invite.workspace_id,
      role: invite.role,
    },
    { onConflict: 'project_id,user_id' }
  );

  if (wsError || projectError) {
    logger.warn('Invitation membership write failed', {
      error: (wsError ?? projectError)?.message,
      project_id: invite.project_id,
    });
    return NextResponse.json(
      {
        error: 'We could not add you to the project. Ask the person who invited you to send a new link.',
        createdAccount,
      },
      { status: 500 }
    );
  }

  const result = acceptInvitation(validated.token, userId, userEmail);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });

  const { error: markError } = await writer
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('token', validated.token);
  if (markError) logger.warn('Invitation row not marked accepted', { error: markError.message });

  logger.info('Project invitation accepted', { role: invite.role, project_id: invite.project_id });

  return NextResponse.json({
    success: true,
    projectId: invite.project_id,
    role: invite.role,
    email: userEmail,
    createdAccount,
    redirectUrl: `/projects/${invite.project_id}`,
  });
}
