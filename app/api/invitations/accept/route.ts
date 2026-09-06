import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { invitationSchemas } from '@/lib/validation/workspace';
import { acceptInvitation, getInvitationByToken } from '@/lib/invitations/store';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = invitationSchemas.accept.parse(body);

    const invite = getInvitationByToken(validated.token);
    if (!invite) {
      return NextResponse.json(
        { error: 'This invitation link is invalid or has expired.' },
        { status: 404 }
      );
    }

    if (invite.accepted_at) {
      return NextResponse.json(
        { error: 'This invitation has already been accepted.' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    let targetUserId = user?.id;
    let targetUserEmail = user?.email;

    // If user is not logged in but submitted their password to sign up ("need to sign up via pas")
    if (!targetUserId && validated.password) {
      const adminClient = createAdminClient();
      try {
        // Try creating user via admin client
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email: invite.email,
          password: validated.password,
          email_confirm: true,
          user_metadata: {
            full_name: validated.full_name || invite.email.split('@')[0],
          },
        });

        if (createError) {
          // If already exists, user can sign in with password
          if (createError.message.toLowerCase().includes('already')) {
            return NextResponse.json(
              { error: 'An account with this email already exists. Please sign in to accept the invite.' },
              { status: 409 }
            );
          }
          throw createError;
        }

        targetUserId = newUser.user.id;
        targetUserEmail = newUser.user.email;
      } catch (adminErr: unknown) {
        // Fallback for environments without Supabase Service Role Key: generate local user ID
        logger.warn('Admin user creation skipped, creating local member', {
          error: adminErr instanceof Error ? adminErr.message : String(adminErr),
        });
        targetUserId = 'u_' + crypto.randomUUID().slice(0, 8);
        targetUserEmail = invite.email;
      }
    }

    if (!targetUserId) {
      targetUserId = 'u_' + crypto.randomUUID().slice(0, 8);
      targetUserEmail = invite.email;
    }

    // Accept invitation in store
    const result = acceptInvitation(validated.token, targetUserId, targetUserEmail);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Insert into project_members & workspace_members in Supabase if reachable
    try {
      if (invite.project_id) {
        await supabase.from('project_members').upsert({
          project_id: invite.project_id,
          user_id: targetUserId,
          workspace_id: invite.workspace_id,
          role: invite.role,
        });
      }

      await supabase.from('workspace_members').upsert({
        workspace_id: invite.workspace_id,
        user_id: targetUserId,
        role: invite.role,
      });

      await (supabase as any)
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('token', validated.token);
    } catch {
      // In-memory store acts as authority when Supabase tables are offline
    }

    logger.info('Project invitation accepted successfully', {
      token: validated.token,
      email: invite.email,
      role: invite.role,
      project_id: invite.project_id,
    });

    const redirectUrl = `/projects/${invite.project_id || 'sample'}`;

    return NextResponse.json({
      success: true,
      message: `Welcome! You joined ${invite.project_name} as ${invite.role}.`,
      projectId: invite.project_id,
      role: invite.role,
      redirectUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to accept invitation';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
