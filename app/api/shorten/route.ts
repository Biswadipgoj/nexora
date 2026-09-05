import { NextRequest, NextResponse } from 'next/server';
import { createShortLink, listShortLinks } from '@/lib/share/shortener';

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  const links = listShortLinks(projectId);
  return NextResponse.json({ links });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, workspaceId, customAlias, role } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const shortLink = createShortLink({
      projectId,
      workspaceId,
      customAlias,
      role: role || 'contributor',
    });

    const origin = request.nextUrl.origin;
    const fullShortUrl = `${origin}/s/${shortLink.code}`;

    return NextResponse.json({
      success: true,
      shortLink,
      fullShortUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate short link';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
