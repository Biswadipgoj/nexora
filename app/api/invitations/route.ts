import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { invitationSchemas } from '@/lib/validation/workspace';
import {
  createInvitation,
  getInvitationByToken,
  listProjectInvitations,
  revokeInvitation,
} from '@/lib/invitations/store';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get('token');
  const projectId = searchParams.get('projectId');

  // Public resolution of an invite token for the landing/signup screen
  if (token) {
    const invitation = getInvitationByToken(token);
    if (!invitation) {
      return NextResponse.json(
        { error: 'This invitation link is invalid or has expired.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ invitation });
  }

  // Listing invitations for a project (authenticated)
  if (projectId) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invitations = listProjectInvitations(projectId);
    return NextResponse.json({ invitations });
  }

  return NextResponse.json(
    { error: 'token or projectId parameter is required' },
    { status: 400 }
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = invitationSchemas.create.parse(body);

    const origin = request.nextUrl.origin;
    const inviterName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Team Member';

    // Create the invitation in the invitations store
    const invitation = createInvitation({
      workspace_id: validated.workspace_id,
      project_id: validated.project_id,
      project_name: body.project_name,
      project_key: body.project_key,
      email: validated.email,
      role: validated.role,
      invited_by: user.id,
      invited_by_name: inviterName,
    });

    // Also attempt to persist in Supabase if table exists
    try {
      await (supabase as any).from('invitations').insert({
        workspace_id: validated.workspace_id,
        email: validated.email,
        role: validated.role,
        invited_by: user.id,
        token: invitation.token,
        expires_at: invitation.expires_at,
      });
    } catch {
      // Supabase table or credentials might not be configured in local dev, in-memory store acts as authority
    }

    const inviteUrl = `${origin}/invite/${invitation.token}`;

    logger.info('Project invitation created', {
      email: validated.email,
      role: validated.role,
      project_id: validated.project_id,
      user_id: user.id,
    });

    return NextResponse.json({
      success: true,
      invitation,
      inviteUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create invitation';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'token parameter is required' }, { status: 400 });
  }

  const revoked = revokeInvitation(token);
  if (!revoked) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
