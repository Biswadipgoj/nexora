import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isDemoRequest } from '@/lib/supabase/config';
import { createShortLink, getShortLinkRecord, listShortLinks, type ShortLink } from '@/lib/share/shortener';
import { getDemoProjectById } from '@/lib/demo/demo-store';
import { UUID_REGEX } from '@/lib/db/reference-ids';

/**
 * Project share links.
 *
 * This route had no authentication at all: anyone could mint links for any
 * project, and a custom alias silently replaced an existing link with the same
 * name — so a stranger could re-point someone's shared link at another board.
 */

const ROLES: ReadonlyArray<ShortLink['role']> = ['viewer', 'contributor', 'admin'];
const ALIAS_PATTERN = /^[a-z0-9][a-z0-9-_]{1,39}$/;

/** Confirms the caller can see the project the link would point at. */
async function authorize(request: NextRequest, projectId: string): Promise<NextResponse | null> {
  if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 });

  if (isDemoRequest(request.cookies)) {
    return getDemoProjectById(projectId) ? null : NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!UUID_REGEX.test(projectId)) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const { data: project } = await supabase.from('projects').select('id').eq('id', projectId).maybeSingle();
  return project ? null : NextResponse.json({ error: 'Project not found' }, { status: 404 });
}

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('projectId') ?? '';
  const denied = await authorize(request, projectId);
  if (denied) return denied;

  return NextResponse.json({ links: listShortLinks(projectId) });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const projectId = typeof body?.projectId === 'string' ? body.projectId : '';

  const denied = await authorize(request, projectId);
  if (denied) return denied;

  const requestedRole = body?.role;
  const role = ROLES.includes(requestedRole as ShortLink['role']) ? (requestedRole as ShortLink['role']) : 'viewer';

  let customAlias: string | undefined;
  if (typeof body?.customAlias === 'string' && body.customAlias.trim()) {
    customAlias = body.customAlias.trim().toLowerCase();
    if (!ALIAS_PATTERN.test(customAlias)) {
      return NextResponse.json(
        { error: 'Use 2–40 lowercase letters, numbers, hyphens or underscores.' },
        { status: 400 }
      );
    }
    if (getShortLinkRecord(customAlias)) {
      return NextResponse.json({ error: 'That link name is taken. Try another.' }, { status: 409 });
    }
  }

  const shortLink = createShortLink({
    projectId,
    workspaceId: typeof body?.workspaceId === 'string' ? body.workspaceId : undefined,
    customAlias,
    role,
  });

  return NextResponse.json({
    success: true,
    shortLink,
    fullShortUrl: `${request.nextUrl.origin}/s/${shortLink.code}`,
  });
}
