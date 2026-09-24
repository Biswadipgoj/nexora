import { NextRequest, NextResponse } from 'next/server';
import { getShortLink } from '@/lib/share/shortener';
import { getRealUser } from '@/lib/supabase/server';
import { DEMO_COOKIE_MAX_AGE, DEMO_COOKIE_NAME, DEMO_COOKIE_OPTIONS } from '@/lib/supabase/config';
import { getDemoProjectById } from '@/lib/demo/demo-store';

/**
 * Share-link redirect.
 *
 * A visitor who is already signed in keeps their own session and goes straight
 * to the board. An anonymous visitor gets the read-only demo session only when
 * the link points at a demo project; a link to a real project sends them to
 * sign in and back, instead of into a demo session that cannot open it.
 *
 * The signed-in check reads the real Supabase session, not the demo override —
 * that override used to make every visitor look signed in on deployments
 * without Supabase credentials.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const link = getShortLink(code);
  const origin = request.nextUrl.origin;

  if (!link) {
    return NextResponse.redirect(`${origin}/dashboard?error=invalid_link`);
  }

  const signedIn = Boolean(await getRealUser());
  const boardUrl = `${origin}${link.targetUrl}`;

  if (!signedIn) {
    if (getDemoProjectById(link.projectId)) {
      const response = NextResponse.redirect(boardUrl, { status: 307 });
      response.cookies.set({ name: DEMO_COOKIE_NAME, value: 'true', maxAge: DEMO_COOKIE_MAX_AGE, ...DEMO_COOKIE_OPTIONS });
      return response;
    }

    const login = new URL('/auth/login', origin);
    login.searchParams.set('next', link.targetUrl);
    return NextResponse.redirect(login, { status: 307 });
  }

  return NextResponse.redirect(boardUrl, { status: 307 });
}
